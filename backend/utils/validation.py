import re
import zipfile
import math
from io import BytesIO
from bson import ObjectId

from config import Config
from utils.errors import APIError

WALLET_ADDRESS_REGEX = re.compile(r"^0x[a-fA-F0-9]{40}$")


def validate_wallet_address(address: str) -> str:
    if not address or not WALLET_ADDRESS_REGEX.match(address):
        raise APIError("Invalid wallet address format", status_code=400)
    return address


def validate_survey_number(survey_number: str) -> str:
    if not survey_number or not isinstance(survey_number, str):
        raise APIError("Survey number is required", status_code=400)
    return survey_number.strip()


def validate_polygon_boundary(boundary: dict) -> dict:
    if not isinstance(boundary, dict) or boundary.get("type") != "Polygon":
        raise APIError("Property boundary must be a GeoJSON Polygon", status_code=400)

    coordinates = boundary.get("coordinates")
    if not isinstance(coordinates, list) or len(coordinates) != 1:
        raise APIError("Property boundary must contain one exterior ring", status_code=400)

    ring = coordinates[0]
    if not isinstance(ring, list) or len(ring) < 4:
        raise APIError("Property boundary must contain at least three vertices", status_code=400)

    normalized = []
    for position in ring:
        if not isinstance(position, (list, tuple)) or len(position) < 2:
            raise APIError("Each boundary position must contain longitude and latitude", status_code=400)
        longitude, latitude = position[:2]
        if (
            isinstance(longitude, bool)
            or isinstance(latitude, bool)
            or not isinstance(longitude, (int, float))
            or not isinstance(latitude, (int, float))
            or not math.isfinite(longitude)
            or not math.isfinite(latitude)
            or not -180 <= longitude <= 180
            or not -90 <= latitude <= 90
        ):
            raise APIError("Boundary coordinates must be finite longitude/latitude values", status_code=400)
        normalized.append([float(longitude), float(latitude)])

    if normalized[0] != normalized[-1]:
        raise APIError("Property boundary ring must be closed", status_code=400)
    if len({(point[0], point[1]) for point in normalized[:-1]}) < 3:
        raise APIError("Property boundary must contain at least three distinct vertices", status_code=400)

    def orientation(a, b, c):
        return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])

    def on_segment(a, b, point):
        return (
            min(a[0], b[0]) <= point[0] <= max(a[0], b[0])
            and min(a[1], b[1]) <= point[1] <= max(a[1], b[1])
        )

    segments = list(zip(normalized, normalized[1:]))
    for first_index, (a, b) in enumerate(segments):
        for second_index in range(first_index + 1, len(segments)):
            if second_index == first_index + 1 or (
                first_index == 0 and second_index == len(segments) - 1
            ):
                continue
            c, d = segments[second_index]
            ab_c, ab_d = orientation(a, b, c), orientation(a, b, d)
            cd_a, cd_b = orientation(c, d, a), orientation(c, d, b)
            intersects = (
                (ab_c > 0 > ab_d or ab_d > 0 > ab_c)
                and (cd_a > 0 > cd_b or cd_b > 0 > cd_a)
            ) or (
                (math.isclose(ab_c, 0.0) and on_segment(a, b, c))
                or (math.isclose(ab_d, 0.0) and on_segment(a, b, d))
                or (math.isclose(cd_a, 0.0) and on_segment(c, d, a))
                or (math.isclose(cd_b, 0.0) and on_segment(c, d, b))
            )
            if intersects:
                raise APIError("Property boundary must not self-intersect", status_code=400)

    area = sum(
        normalized[index][0] * normalized[index + 1][1]
        - normalized[index + 1][0] * normalized[index][1]
        for index in range(len(normalized) - 1)
    )
    if math.isclose(area, 0.0, abs_tol=1e-12):
        raise APIError("Property boundary must enclose a non-zero area", status_code=400)

    return {"type": "Polygon", "coordinates": [normalized]}


def validate_property_id(property_id: str) -> None:
    if not property_id or not ObjectId.is_valid(property_id):
        raise APIError("Invalid property ID", status_code=400)


def validate_property_data(data: dict, update: bool = False) -> None:
    required_fields = ["survey_number", "owner_wallet"]
    if not update:
        missing = [field for field in required_fields if field not in data or not data[field]]
        if missing:
            raise APIError(f"Missing required fields: {', '.join(missing)}", status_code=400)

    if "survey_number" in data:
        validate_survey_number(data["survey_number"])
    if "owner_wallet" in data:
        validate_wallet_address(data["owner_wallet"])


def validate_document_upload(
    reference_id: str,
    document_type: str,
    file
) -> None:

    if not reference_id:
        raise APIError(
            "Property or application reference is required",
            status_code=400
        )

    if not document_type:
        raise APIError(
            "Document type is required",
            status_code=400
        )

    if not file or file.filename == "":
        raise APIError(
            "Document file is required",
            status_code=400
        )

    if "." not in file.filename:
        raise APIError(
            "File must have an extension",
            status_code=400
        )

    extension = (
        file.filename
        .rsplit(".", 1)[-1]
        .lower()
    )

    if extension not in Config.ALLOWED_DOCUMENT_EXTENSIONS:
        raise APIError(
            "Unsupported file type",
            status_code=400
        )

    content = file.stream.read(16)
    file.stream.seek(0)
    signatures = {
        "pdf": content.startswith(b"%PDF-"),
        "png": content.startswith(b"\x89PNG\r\n\x1a\n"),
        "jpg": content.startswith(b"\xff\xd8\xff"),
        "jpeg": content.startswith(b"\xff\xd8\xff"),
        "doc": content.startswith(bytes.fromhex("D0CF11E0A1B11AE1")),
        "docx": False,
        "txt": b"\x00" not in content,
    }
    if extension == "docx":
        try:
            with zipfile.ZipFile(file.stream) as archive:
                signatures["docx"] = "word/document.xml" in archive.namelist()
        except (zipfile.BadZipFile, OSError):
            signatures["docx"] = False
        finally:
            file.stream.seek(0)

    if not signatures.get(extension, False):
        raise APIError(
            "File contents do not match the selected file type",
            status_code=400
        )