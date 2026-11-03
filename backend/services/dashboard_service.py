from database.client import get_database


class DashboardService:
    def __init__(self):
        self.db = get_database()

    def admin_stats(self) -> dict:
        apps = list(self.db.applications.find({}))
        docs = list(self.db.documents.find({}))
        props = list(self.db.properties.find({}))
        txs = list(self.db.transactions.find({}))

        def count_apps(*types, statuses=None):
            total = 0
            for a in apps:
                if types and a.get("application_type") not in types:
                    continue
                if statuses and a.get("status") not in statuses:
                    continue
                total += 1
            return total

        pending_statuses = {
            "SUBMITTED",
            "UNDER_REVIEW",
            "DOCUMENTS_PENDING",
            "UNDER_VERIFICATION",
            "VERIFIED",
            "APPROVED",
            "BLOCKCHAIN_PENDING",
        }

        flagged_docs = [
            d for d in docs
            if d.get("verification_status") in ("REJECTED", "REQUIRES_MANUAL_REVIEW")
            or any(
                c.get("severity") in ("HIGH", "CRITICAL")
                for c in (d.get("verification_checks") or [])
            )
        ]

        recent_txs = sorted(
            txs,
            key=lambda t: t.get("timestamp") or "",
            reverse=True,
        )[:10]

        def ser_tx(t):
            data = dict(t)
            data["id"] = str(data.get("_id", ""))
            data.pop("_id", None)
            return data

        return {
            "total_properties": len(props),
            "pending_registrations": count_apps(
                "NEW_REGISTRATION", "REGISTRATION", statuses=pending_statuses
            ),
            "pending_transfers": count_apps(
                "OWNERSHIP_TRANSFER", "TRANSFER", statuses=pending_statuses
            ),
            "pending_inheritance": count_apps(
                "INHERITANCE_TRANSFER", "INHERITANCE", statuses=pending_statuses
            ),
            "approved_applications": count_apps(statuses={"APPROVED", "COMPLETED"}),
            "rejected_applications": count_apps(statuses={"REJECTED"}),
            "pending_document_verification": len(
                [d for d in docs if d.get("verification_status") in ("PENDING", "REQUIRES_MANUAL_REVIEW")]
            ),
            "flagged_documents": len(flagged_docs),
            "recent_blockchain_transactions": [ser_tx(t) for t in recent_txs],
            "total_users": self.db.users.count_documents({}),
        }

    def user_stats(self, user_id: str = None, wallet: str = None, email: str = None) -> dict:
        prop_query = {}
        app_query = {}
        if wallet:
            prop_query["owner_wallet"] = wallet
            app_query["applicant_wallet"] = wallet

        properties = list(self.db.properties.find(prop_query)) if prop_query else []
        applications = list(self.db.applications.find(app_query)) if app_query else []

        # Also match applications by email in party_details
        if email and not applications:
            all_apps = list(self.db.applications.find({}))
            applications = [
                a for a in all_apps
                if (a.get("party_details") or {}).get("applicant_email") == email
                or a.get("applicant_email") == email
            ]

        pending = [
            a for a in applications
            if a.get("status") not in ("COMPLETED", "REJECTED")
        ]

        def ser(a):
            data = dict(a)
            data["id"] = str(data.get("_id", ""))
            data["_id"] = data["id"]
            return data

        return {
            "registered_properties": len(properties),
            "submitted_applications": len(applications),
            "pending_applications": len(pending),
            "properties": [
                {
                    "property_id": p.get("property_id"),
                    "survey_number": p.get("survey_number"),
                    "status": p.get("status"),
                    "area": p.get("area"),
                    "owner_wallet": p.get("owner_wallet"),
                }
                for p in properties
            ],
            "recent_applications": [ser(a) for a in applications[:10]],
        }
