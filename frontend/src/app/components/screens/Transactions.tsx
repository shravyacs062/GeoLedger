import { useState, useEffect } from 'react';
import {
  ArrowLeftRight,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  Hash,
  Search,
  RefreshCw,
} from 'lucide-react';

import { Layout } from '../Layout';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { api } from '../../../services/api';

type TransactionStatus = 'completed' | 'pending';

interface Transaction {
  id: string;
  propertyId: string;
  surveyNumber: string;
  type: string;
  previousOwner: string;
  newOwner: string;
  date: string;
  status: TransactionStatus;
  blockchainHash: string;
  blockNumber?: number;
  blockHash?: string;
  blockTimestamp?: string;
  transactionIndex?: number;
  gasUsed?: number;
  chainId?: number;
  simulation: boolean | null;
  blockLogSaved: boolean;
}

function TransactionStatusBadge({
  status,
}: {
  status: TransactionStatus;
}) {
  if (status === 'completed') {
    return (
      <Badge className="border-[#BBF7D0] bg-[#F0FDF4] text-[#15803D]">
        <CheckCircle2 className="mr-1 h-3 w-3" />
        Completed
      </Badge>
    );
  }

  return (
    <Badge className="border-[#BAE6FD] bg-[#F0F9FF] text-[#0369A1]">
      <Clock3 className="mr-1 h-3 w-3" />
      Pending
    </Badge>
  );
}

export function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const data = await api.blockchain.getTransactions();
      const mapped: Transaction[] = (data || []).map((t: any, idx: number) => ({
        id: t.transaction_id || t.id || `TXN-2026-00${idx + 1}`,
        propertyId: t.property_id || t.propertyId || 'N/A',
        surveyNumber: t.survey_number || t.surveyNumber || 'N/A',
        type: (t.transaction_type || t.type || 'REGISTRATION').replace(/_/g, ' '),
        previousOwner: t.previous_owner || t.from_address || 'GOVERNMENT AUTHORITY',
        newOwner: t.new_owner || t.to_address || 'OWNER',
        date: t.timestamp ? new Date(t.timestamp).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent',
        status: (t.status?.toLowerCase() === 'confirmed' || t.status?.toLowerCase() === 'completed') ? 'completed' : 'pending',
        blockchainHash: t.tx_hash || t.blockchainHash || 'Pending confirmation',
        blockNumber: t.block_number,
        blockHash: t.block_hash,
        blockTimestamp: t.block_timestamp,
        transactionIndex: t.transaction_index,
        gasUsed: t.gas_used,
        chainId: t.chain_id,
        simulation: typeof t.simulation === 'boolean' ? t.simulation : null,
        blockLogSaved: t.block_log_saved !== false,
      }));
      setTransactions(mapped);
    } catch (err) {
      console.error('Failed to fetch transactions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const filteredTransactions = transactions.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      t.id.toLowerCase().includes(q) ||
      t.propertyId.toLowerCase().includes(q) ||
      t.surveyNumber.toLowerCase().includes(q) ||
      t.blockchainHash.toLowerCase().includes(q) ||
      t.newOwner.toLowerCase().includes(q)
    );
  });

  const completed = transactions.filter((t) => t.status === 'completed').length;
  const pending = transactions.filter((t) => t.status === 'pending').length;

  return (
    <Layout>
      <div className="p-4 lg:p-8">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-[#0F172A] mb-2">
              Transactions
            </h1>
            <p className="text-[#64748B]">
              View approved ownership transactions and their immutable blockchain records.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={fetchTransactions}
            disabled={loading}
            className="border-[#E2E8F0] gap-2 self-start sm:self-auto"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Summary */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">

          <Card className="border-[#E2E8F0]">
            <CardContent className="p-5">
              <ArrowLeftRight className="mb-3 h-5 w-5 text-[#0F766E]" />
              <p className="text-2xl font-semibold text-[#0F172A]">
                {transactions.length}
              </p>
              <p className="text-xs text-[#64748B]">
                Total Transactions
              </p>
            </CardContent>
          </Card>

          <Card className="border-[#BBF7D0] bg-[#F0FDF4]">
            <CardContent className="p-5">
              <CheckCircle2 className="mb-3 h-5 w-5 text-[#16A34A]" />
              <p className="text-2xl font-semibold text-[#0F172A]">
                {completed}
              </p>
              <p className="text-xs text-[#64748B]">
                Completed On-Chain
              </p>
            </CardContent>
          </Card>

          <Card className="border-[#BAE6FD] bg-[#F0F9FF]">
            <CardContent className="p-5">
              <Clock3 className="mb-3 h-5 w-5 text-[#0369A1]" />
              <p className="text-2xl font-semibold text-[#0F172A]">
                {pending}
              </p>
              <p className="text-xs text-[#64748B]">
                Pending
              </p>
            </CardContent>
          </Card>

        </div>

        {/* Search */}
        <Card className="mb-6 border-[#E2E8F0]">
          <CardContent className="p-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
              <Input
                placeholder="Search by transaction ID, property ID, survey number, or wallet..."
                className="border-[#E2E8F0] pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Transactions */}
        <Card className="border-[#E2E8F0]">
          <CardHeader>
            <CardTitle className="text-[#0F172A]">
              Confirmed Blockchain Ledger
            </CardTitle>
            <p className="text-sm text-[#64748B]">
              Transactions recorded after successful application verification and authorization.
            </p>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="py-12 text-center text-[#64748B]">
                <RefreshCw className="mx-auto h-8 w-8 animate-spin text-[#0F766E] mb-2" />
                Loading ledger records...
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="py-12 text-center text-[#64748B]">
                No transactions match your query.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="rounded-xl border border-[#E2E8F0] bg-white p-5"
                  >
                    {/* Top */}
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F0FDFA]">
                          <ArrowLeftRight className="h-5 w-5 text-[#0F766E]" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="font-semibold text-[#0F172A]">
                              {transaction.id}
                            </h3>
                            <TransactionStatusBadge status={transaction.status} />
                          </div>
                          <p className="mt-1 text-sm text-[#64748B]">
                            {transaction.type}
                          </p>
                        </div>
                      </div>

                      <div className="text-sm text-[#64748B] text-right">
                        <p>{transaction.date}</p>
                        {transaction.blockNumber && (
                          <p className="font-mono text-xs text-[#0F766E]">Block #{transaction.blockNumber}</p>
                        )}
                      </div>
                    </div>

                    {/* Ownership change */}
                    <div className="mt-5 grid gap-4 rounded-lg bg-[#F8FAFC] p-4 sm:grid-cols-3">
                      <div>
                        <p className="text-xs text-[#94A3B8]">Property</p>
                        <p className="mt-1 text-sm font-medium text-[#0F172A] truncate">
                          {transaction.propertyId}
                        </p>
                        <p className="mt-1 text-xs text-[#64748B]">
                          Survey No. {transaction.surveyNumber}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-[#94A3B8]">Previous Owner / From</p>
                        <p className="mt-1 font-mono text-xs font-medium text-[#0F172A] truncate" title={transaction.previousOwner}>
                          {transaction.previousOwner}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-[#94A3B8]">New Owner / To</p>
                        <p className="mt-1 font-mono text-xs font-medium text-[#0F172A] truncate" title={transaction.newOwner}>
                          {transaction.newOwner}
                        </p>
                      </div>
                    </div>

                    {/* Blockchain */}
                    <div className="mt-4 flex flex-col gap-3 rounded-lg border border-[#E2E8F0] p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 gap-3">
                        <Hash className="mt-0.5 h-5 w-5 shrink-0 text-[#64748B]" />
                        <div className="min-w-0">
                          <p className="text-xs text-[#94A3B8]">
                            Blockchain Transaction Hash
                          </p>
                          <p className="mt-1 truncate font-mono text-xs text-[#0F766E]">
                            {transaction.blockchainHash}
                          </p>
                        </div>
                      </div>

                      {transaction.status === 'completed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-[#E2E8F0] shrink-0"
                          onClick={() => {
                            navigator.clipboard.writeText(transaction.blockchainHash);
                            alert('Copied transaction hash: ' + transaction.blockchainHash);
                          }}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Copy TxHash
                        </Button>
                      )}
                    </div>

                    <div className="mt-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-[#0F172A]">Block Details</p>
                        <Badge className={transaction.simulation === true
                          ? 'border-[#FDE68A] bg-[#FFFBEB] text-[#92400E]'
                          : transaction.simulation === false
                            ? 'border-[#BBF7D0] bg-[#F0FDF4] text-[#15803D]'
                            : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#475569]'}>
                          {transaction.simulation === true
                            ? 'Development simulation'
                            : transaction.simulation === false
                              ? 'On-chain'
                              : 'Legacy record · source unknown'}
                        </Badge>
                      </div>
                      <div className="grid gap-3 text-xs sm:grid-cols-2">
                        <div>
                          <p className="text-[#94A3B8]">Block hash</p>
                          <p className="mt-1 break-all font-mono text-[#0F766E]">
                            {transaction.simulation === true
                              ? 'Not available in simulation mode'
                              : transaction.blockHash || 'Not recorded for this transaction'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[#94A3B8]">Block timestamp</p>
                          <p className="mt-1 text-[#334155]">
                            {transaction.blockTimestamp
                              ? new Date(transaction.blockTimestamp).toLocaleString()
                              : 'Not recorded'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[#94A3B8]">Transaction index</p>
                          <p className="mt-1 text-[#334155]">
                            {transaction.transactionIndex ?? 'Not recorded'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[#94A3B8]">Gas used</p>
                          <p className="mt-1 text-[#334155]">
                            {transaction.gasUsed?.toLocaleString() ?? 'Not recorded'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[#94A3B8]">Chain ID</p>
                          <p className="mt-1 text-[#334155]">{transaction.chainId ?? 'Not recorded'}</p>
                        </div>
                        <div>
                          <p className="text-[#94A3B8]">Local block log</p>
                          <p className="mt-1 text-[#334155]">
                            {transaction.blockLogSaved ? 'Saved' : 'Could not be saved; see backend log'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Explanation */}
        <div className="mt-6 rounded-xl border border-[#E2E8F0] bg-white p-5">
          <div className="flex gap-3">
            <FileText className="mt-0.5 h-5 w-5 shrink-0 text-[#0F766E]" />
            <div>
              <p className="text-sm font-medium text-[#0F172A]">
                When is a blockchain transaction created?
              </p>
              <p className="mt-1 text-xs leading-5 text-[#64748B]">
                A blockchain transaction is created only after the application has completed the required document
                verification and authorization process. Submitting an application or uploading a document does not
                itself modify the ownership record.
              </p>
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
}
