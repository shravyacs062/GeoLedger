import { useEffect, useState } from 'react';
import { Layout } from '../Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { AlertCircle, Loader2, Calculator } from 'lucide-react';
import { api } from '../../../services/api';
import { useAuth } from '../../context/useAuth';

export function LandValuation() {
  const { isAdmin } = useAuth();
  const [area, setArea] = useState('2500');
  const [landType, setLandType] = useState('Residential');
  const [locationCategory, setLocationCategory] = useState('urban');
  const [district, setDistrict] = useState('Mysuru');
  const [surveyNumber, setSurveyNumber] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<any>(null);
  const [paramsMsg, setParamsMsg] = useState<string | null>(null);
  const [savingParams, setSavingParams] = useState(false);

  useEffect(() => {
    api.valuation.getParams().then(setParams).catch(() => setParams(null));
  }, []);

  const estimate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await api.valuation.estimate({
        area: Number(area),
        land_type: landType,
        location_category: locationCategory,
        district,
        survey_number: surveyNumber || undefined,
      });
      setResult(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Valuation failed');
    } finally {
      setLoading(false);
    }
  };

  const updateBaseRate = (type: string, value: string) => {
    setParams((prev: any) => ({
      ...prev,
      base_rate_per_sqft: {
        ...(prev?.base_rate_per_sqft || {}),
        [type]: Number(value),
      },
    }));
  };

  const updateLocMult = (key: string, value: string) => {
    setParams((prev: any) => ({
      ...prev,
      location_multipliers: {
        ...(prev?.location_multipliers || {}),
        [key]: Number(value),
      },
    }));
  };

  const updateDistMult = (key: string, value: string) => {
    setParams((prev: any) => ({
      ...prev,
      district_multipliers: {
        ...(prev?.district_multipliers || {}),
        [key]: Number(value),
      },
    }));
  };

  const saveParams = async () => {
    if (!params) return;
    setSavingParams(true);
    setParamsMsg(null);
    try {
      const updated = await api.valuation.updateParams({
        base_rate_per_sqft: params.base_rate_per_sqft,
        location_multipliers: params.location_multipliers,
        district_multipliers: params.district_multipliers,
      });
      setParams(updated);
      setParamsMsg('Valuation parameters updated');
    } catch (err: any) {
      setParamsMsg(err?.response?.data?.message || 'Failed to update parameters');
    } finally {
      setSavingParams(false);
    }
  };

  return (
    <Layout>
      <div className="p-4 lg:p-8 max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-[#0F172A]">Land Valuation</h1>
          <p className="text-[#64748B]">System-generated estimate — not an official government valuation</p>
        </div>

        <Card className="border-[#E2E8F0]">
          <CardHeader>
            <CardTitle>Estimate Property Value</CardTitle>
            <CardDescription>Based on area, land type, location category, and district factors</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={estimate} className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Area (sq ft)</Label>
                <Input type="number" value={area} onChange={(e) => setArea(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Land Type</Label>
                <select
                  className="w-full h-10 rounded-md border border-[#E2E8F0] px-3 text-sm"
                  value={landType}
                  onChange={(e) => setLandType(e.target.value)}
                >
                  {['Residential', 'Commercial', 'Agricultural', 'Industrial', 'Other'].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Location Category</Label>
                <select
                  className="w-full h-10 rounded-md border border-[#E2E8F0] px-3 text-sm"
                  value={locationCategory}
                  onChange={(e) => setLocationCategory(e.target.value)}
                >
                  <option value="urban">Urban</option>
                  <option value="semi_urban">Semi-urban</option>
                  <option value="rural">Rural</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>District</Label>
                <Input value={district} onChange={(e) => setDistrict(e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Survey Number (optional)</Label>
                <Input value={surveyNumber} onChange={(e) => setSurveyNumber(e.target.value)} placeholder="SN-DEMO-001" />
              </div>
              {error && (
                <div className="sm:col-span-2 flex gap-2 text-sm text-[#991B1B]">
                  <AlertCircle className="w-4 h-4" /> {error}
                </div>
              )}
              <div className="sm:col-span-2">
                <Button type="submit" disabled={loading} className="bg-[#0F766E] hover:bg-[#0F766E]/90">
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Calculator className="w-4 h-4 mr-2" />}
                  Calculate Estimate
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {result && (
          <Card className="border-[#E2E8F0]">
            <CardHeader>
              <CardTitle>Estimated Value</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-3xl font-semibold text-[#0F766E]">
                ₹{Number(result.estimated_value).toLocaleString('en-IN')}
              </p>
              <p className="text-sm text-[#64748B]">{result.disclaimer}</p>
              <div className="text-sm space-y-1 bg-[#F8FAFC] rounded-lg p-4 border border-[#E2E8F0]">
                <p>Formula: {result.factors?.formula}</p>
                <p>Base rate: ₹{result.factors?.base_rate_per_sqft}/sq ft</p>
                <p>Location multiplier: {result.factors?.location_multiplier}</p>
                <p>District multiplier: {result.factors?.district_multiplier}</p>
                <p>Official valuation: {result.is_official_valuation ? 'Yes' : 'No'}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {isAdmin && params && (
          <Card className="border-[#E2E8F0]">
            <CardHeader>
              <CardTitle>Admin: Valuation Parameters</CardTitle>
              <CardDescription>Adjust base rates and multipliers used by the estimator</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-sm font-medium mb-2">Base rate (₹ / sq ft)</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {Object.entries(params.base_rate_per_sqft || {}).map(([type, rate]) => (
                    <div key={type} className="space-y-1">
                      <Label>{type}</Label>
                      <Input
                        type="number"
                        value={String(rate)}
                        onChange={(e) => updateBaseRate(type, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Location multipliers</p>
                <div className="grid sm:grid-cols-3 gap-3">
                  {Object.entries(params.location_multipliers || {}).map(([key, val]) => (
                    <div key={key} className="space-y-1">
                      <Label>{key}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={String(val)}
                        onChange={(e) => updateLocMult(key, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">District multipliers</p>
                <div className="grid sm:grid-cols-3 gap-3">
                  {Object.entries(params.district_multipliers || {}).map(([key, val]) => (
                    <div key={key} className="space-y-1">
                      <Label>{key}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={String(val)}
                        onChange={(e) => updateDistMult(key, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Button type="button" onClick={saveParams} disabled={savingParams} className="bg-[#0F766E] hover:bg-[#0F766E]/90">
                {savingParams && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Parameters
              </Button>
              {paramsMsg && <p className="text-sm text-[#64748B]">{paramsMsg}</p>}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
