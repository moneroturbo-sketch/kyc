import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { isAuthenticated } from "@/lib/auth";
import {
  ArrowUpDown,
  Search,
  Star,
  TrendingUp,
  TrendingDown,
  Shield,
  CheckCircle,
  Filter,
} from "lucide-react";

interface Offer {
  id: string;
  vendorId: string;
  type: string;
  currency: string;
  pricePerUnit: string;
  minLimit: string;
  maxLimit: string;
  availableAmount: string;
  paymentMethods: string[];
  terms: string | null;
  isActive: boolean;
  isPriority: boolean;
}

export default function HomePage() {
  const [, setLocation] = useLocation();
  const [filters, setFilters] = useState({
    type: "",
    currency: "",
    search: "",
  });

  const { data: offers, isLoading } = useQuery<Offer[]>({
    queryKey: ["offers", filters.type, filters.currency],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.type) params.append("type", filters.type);
      if (filters.currency) params.append("currency", filters.currency);
      const res = await fetch(`/api/marketplace/offers?${params}`);
      return res.json();
    },
  });

  const handleTradeClick = (offer: Offer) => {
    if (!isAuthenticated()) {
      setLocation("/auth");
      return;
    }
    setLocation(`/trade/${offer.id}`);
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">
            P2P Crypto Marketplace
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Buy and sell cryptocurrency directly with other users. Secure escrow protection for every trade.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-600 rounded-xl">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-green-400 text-sm">Secure Escrow</p>
                  <p className="text-white text-2xl font-bold">100%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-blue-400 text-sm">Active Offers</p>
                  <p className="text-white text-2xl font-bold">{offers?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border-purple-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-600 rounded-xl">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-purple-400 text-sm">Verified Vendors</p>
                  <p className="text-white text-2xl font-bold">KYC</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="text-white flex items-center gap-2">
                <ArrowUpDown className="h-5 w-5" />
                Available Offers
              </CardTitle>
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search..."
                    className="pl-9 w-40 bg-gray-800 border-gray-700 text-white"
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    data-testid="input-search-offers"
                  />
                </div>
                <Select
                  value={filters.type}
                  onValueChange={(v) => setFilters({ ...filters, type: v })}
                >
                  <SelectTrigger className="w-32 bg-gray-800 border-gray-700 text-white" data-testid="select-type">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="buy">Buy</SelectItem>
                    <SelectItem value="sell">Sell</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={filters.currency}
                  onValueChange={(v) => setFilters({ ...filters, currency: v })}
                >
                  <SelectTrigger className="w-32 bg-gray-800 border-gray-700 text-white" data-testid="select-currency">
                    <SelectValue placeholder="Currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="USDT">USDT</SelectItem>
                    <SelectItem value="BTC">BTC</SelectItem>
                    <SelectItem value="ETH">ETH</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 bg-gray-800" />
                ))}
              </div>
            ) : offers && offers.length > 0 ? (
              <div className="space-y-4">
                {offers.map((offer) => (
                  <div
                    key={offer.id}
                    className="p-4 rounded-xl bg-gray-800/50 border border-gray-700 hover:border-purple-600 transition-colors"
                    data-testid={`offer-card-${offer.id}`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${offer.type === "buy" ? "bg-green-900" : "bg-red-900"}`}>
                          {offer.type === "buy" ? (
                            <TrendingUp className="h-5 w-5 text-green-400" />
                          ) : (
                            <TrendingDown className="h-5 w-5 text-red-400" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">
                              {offer.type.toUpperCase()} {offer.currency}
                            </span>
                            {offer.isPriority && (
                              <Badge className="bg-yellow-600">Featured</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Star className="h-3 w-3 text-yellow-400" />
                            <span>Verified Vendor</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-white">
                            ${parseFloat(offer.pricePerUnit).toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-400">per unit</p>
                        </div>
                        <div className="text-right text-sm">
                          <p className="text-gray-400">
                            Limit: ${parseFloat(offer.minLimit).toFixed(0)} - ${parseFloat(offer.maxLimit).toFixed(0)}
                          </p>
                          <p className="text-gray-400">
                            Available: {parseFloat(offer.availableAmount).toFixed(4)} {offer.currency}
                          </p>
                        </div>
                        <Button
                          className={offer.type === "buy" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
                          onClick={() => handleTradeClick(offer)}
                          data-testid={`button-trade-${offer.id}`}
                        >
                          {offer.type === "buy" ? "Sell" : "Buy"}
                        </Button>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {offer.paymentMethods.map((method) => (
                        <Badge key={method} variant="outline" className="text-gray-400 border-gray-600">
                          {method}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Filter className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No offers available</p>
                <p className="text-gray-500">Check back later or adjust your filters</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
