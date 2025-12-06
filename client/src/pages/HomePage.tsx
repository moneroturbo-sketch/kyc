import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { isAuthenticated, getUser, fetchWithAuth } from "@/lib/auth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown,
  Home,
  ShoppingCart,
  Megaphone,
  MessageCircle,
  User,
  ThumbsUp,
  Clock,
  Filter,
  ChevronLeft,
  Bell,
} from "lucide-react";

interface Offer {
  id: string;
  vendorId: string;
  vendorName?: string;
  vendorTrades?: number;
  vendorCompletionRate?: number;
  vendorRating?: number;
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
  responseTime?: number;
}

export default function HomePage() {
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy");
  const [selectedCurrency, setSelectedCurrency] = useState("USDT");
  const [selectedFiat, setSelectedFiat] = useState("KES");
  const [selectedAmount, setSelectedAmount] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState("all");

  const { data: offers, isLoading } = useQuery<Offer[]>({
    queryKey: ["offers", activeTab === "buy" ? "sell" : "buy", selectedCurrency],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("type", activeTab === "buy" ? "sell" : "buy");
      if (selectedCurrency !== "all") params.append("currency", selectedCurrency);
      const res = await fetch(`/api/marketplace/offers?${params}`);
      return res.json();
    },
  });

  const { data: unreadCount } = useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: async () => {
      const res = await fetchWithAuth("/api/notifications/unread/count");
      const data = await res.json();
      return data.count || 0;
    },
    enabled: isAuthenticated(),
  });

  const handleTradeClick = (offer: Offer) => {
    if (!isAuthenticated()) {
      setLocation("/auth");
      return;
    }
    setLocation(`/trade/${offer.id}`);
  };

  const formatPaymentMethod = (method: string) => {
    const methodMap: Record<string, string> = {
      "mpesa": "M-PESA Kenya",
      "bank_transfer": "Bank Transfer",
      "equity_bank": "Equity Bank",
      "paybill": "M-pesa Paybill",
    };
    return methodMap[method.toLowerCase()] || method;
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <button className="p-1" data-testid="button-back">
              <ChevronLeft className="h-6 w-6 text-gray-800" />
            </button>
            <div className="flex items-center gap-6">
              <span className="text-gray-400 font-medium">Express</span>
              <span className="text-gray-900 font-semibold border-b-2 border-gray-900 pb-1">P2P</span>
              <span className="text-gray-400 font-medium">Block Trade</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-gray-800 font-medium gap-1" data-testid="select-fiat">
              {selectedFiat}
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Link href="/notifications">
              <Button variant="ghost" size="icon" className="relative" data-testid="button-notifications">
                <Bell className="h-5 w-5 text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>
            </Link>
          </div>
        </div>

        <div className="px-4 pb-3">
          <div className="inline-flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab("buy")}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "buy"
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              data-testid="tab-buy"
            >
              Buy
            </button>
            <button
              onClick={() => setActiveTab("sell")}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "sell"
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              data-testid="tab-sell"
            >
              Sell
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between px-4 pb-3">
          <div className="flex items-center gap-3">
            <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
              <SelectTrigger className="w-auto border-0 shadow-none p-0 h-auto bg-transparent" data-testid="filter-currency">
                <div className="flex items-center gap-1 text-gray-800 font-medium">
                  <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">₮</span>
                  </div>
                  <SelectValue />
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USDT">USDT</SelectItem>
                <SelectItem value="BTC">BTC</SelectItem>
                <SelectItem value="ETH">ETH</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedAmount} onValueChange={setSelectedAmount}>
              <SelectTrigger className="w-auto border-0 shadow-none p-0 h-auto bg-transparent" data-testid="filter-amount">
                <div className="flex items-center gap-1 text-gray-600">
                  <SelectValue placeholder="Amount" />
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Amounts</SelectItem>
                <SelectItem value="1000">Up to 1,000 KES</SelectItem>
                <SelectItem value="10000">Up to 10,000 KES</SelectItem>
                <SelectItem value="50000">Up to 50,000 KES</SelectItem>
                <SelectItem value="100000">Up to 100,000 KES</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedPayment} onValueChange={setSelectedPayment}>
              <SelectTrigger className="w-auto border-0 shadow-none p-0 h-auto bg-transparent" data-testid="filter-payment">
                <div className="flex items-center gap-1 text-gray-600">
                  <SelectValue placeholder="Payment" />
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="mpesa">M-PESA</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="paybill">Paybill</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <button className="p-2" data-testid="button-filter">
            <Filter className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-20">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-40 bg-gray-100" />
            ))}
          </div>
        ) : offers && offers.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {offers.map((offer, index) => (
              <div
                key={offer.id}
                className={`p-4 ${offer.isPriority ? "bg-amber-50/50 border-l-4 border-amber-400" : "bg-white"}`}
                data-testid={`offer-card-${offer.id}`}
              >
                {offer.isPriority && (
                  <div className="flex justify-end mb-2">
                    <span className="text-xs text-amber-600 font-medium">Promoted Ad</span>
                  </div>
                )}

                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {(offer.vendorName || "V")[0].toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900">{offer.vendorName || `Vendor_${offer.vendorId.slice(0, 6)}`}</span>
                      <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                      <span>Trade: {offer.vendorTrades ?? 0} Trades ({offer.vendorCompletionRate ?? "100.00"}%)</span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3" />
                        {offer.vendorRating ?? "99.00"}%
                      </span>
                    </div>

                    <div className="mb-2">
                      <span className="text-gray-500 text-sm">KSh </span>
                      <span className="text-2xl font-bold text-gray-900">{parseFloat(offer.pricePerUnit).toFixed(2)}</span>
                      <span className="text-gray-500 text-sm">/{offer.currency}</span>
                    </div>

                    <div className="text-xs text-gray-500 space-y-0.5">
                      <p>Limit <span className="text-gray-700">{parseFloat(offer.minLimit).toLocaleString()} - {parseFloat(offer.maxLimit).toLocaleString()} KES</span></p>
                      <p>Available <span className="text-gray-700">{parseFloat(offer.availableAmount).toFixed(2)} {offer.currency}</span></p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right space-y-1">
                      {offer.paymentMethods.slice(0, 4).map((method, idx) => (
                        <div key={idx} className="flex items-center gap-1 text-xs text-gray-600">
                          <span>{formatPaymentMethod(method)}</span>
                          <div className="w-1.5 h-3 bg-emerald-500 rounded-sm" />
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                      <Clock className="h-3 w-3" />
                      <span>{offer.responseTime || 15} min</span>
                    </div>
                    <Button
                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-2 rounded-md font-medium mt-2"
                      onClick={() => handleTradeClick(offer)}
                      data-testid={`button-trade-${offer.id}`}
                    >
                      {activeTab === "buy" ? "Buy" : "Sell"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <Filter className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">No offers available</p>
            <p className="text-gray-400 text-sm">Check back later or adjust your filters</p>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex items-center justify-around py-2">
          <Link href="/">
            <button className="flex flex-col items-center gap-1 px-4 py-2" data-testid="nav-home">
              <Home className={`h-6 w-6 ${location === "/" ? "text-gray-900" : "text-gray-400"}`} />
              <span className={`text-xs ${location === "/" ? "text-gray-900" : "text-gray-400"}`}>Home</span>
            </button>
          </Link>
          <Link href="/orders">
            <button className="flex flex-col items-center gap-1 px-4 py-2" data-testid="nav-orders">
              <ShoppingCart className={`h-6 w-6 ${location === "/orders" ? "text-gray-900" : "text-gray-400"}`} />
              <span className={`text-xs ${location === "/orders" ? "text-gray-900" : "text-gray-400"}`}>Orders</span>
            </button>
          </Link>
          <Link href="/vendor">
            <button className="flex flex-col items-center gap-1 px-4 py-2" data-testid="nav-ads">
              <Megaphone className={`h-6 w-6 ${location === "/vendor" ? "text-gray-900" : "text-gray-400"}`} />
              <span className={`text-xs ${location === "/vendor" ? "text-gray-900" : "text-gray-400"}`}>Ads</span>
            </button>
          </Link>
          <Link href="/notifications">
            <button className="flex flex-col items-center gap-1 px-4 py-2 relative" data-testid="nav-chat">
              <MessageCircle className={`h-6 w-6 ${location === "/notifications" ? "text-gray-900" : "text-gray-400"}`} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-2 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
              <span className={`text-xs ${location === "/notifications" ? "text-gray-900" : "text-gray-400"}`}>Chat</span>
            </button>
          </Link>
          <Link href="/settings">
            <button className="flex flex-col items-center gap-1 px-4 py-2" data-testid="nav-profile">
              <User className={`h-6 w-6 ${location === "/settings" ? "text-gray-900" : "text-gray-400"}`} />
              <span className={`text-xs ${location === "/settings" ? "text-gray-900" : "text-gray-400"}`}>Profile</span>
            </button>
          </Link>
        </div>
      </nav>
    </div>
  );
}
