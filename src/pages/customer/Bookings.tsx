import { motion } from "framer-motion";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { XCircle, Calendar } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Booking = {
  id: number;
  customer_id: number;
  vendor_id: number;
  service_id: number;
  slot_id: number;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  service_title: string;
  service_price: number;
  vendor_display_name: string;
  slot_date: string;
  slot_start_time: string;
  slot_end_time: string;
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  accepted: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  rejected: "bg-red-500/10 text-red-400 border-red-500/20",
  completed: "bg-green-500/10 text-green-400 border-green-500/20",
  cancelled: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

export default function CustomerBookings() {
  const { toast } = useToast();
  const [filter, setFilter] = useState("all");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const url = filter === "all" ? "/api/bookings" : `/api/bookings?status=${filter}`;
      const response = await fetch(url, { credentials: "include" });
      const result = await response.json();

      if (result.ok) {
        setBookings(result.bookings);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to fetch bookings.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An error occurred while fetching bookings.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [filter]);

  const handleCancelBooking = async () => {
    if (!cancellingId) return;

    try {
      const response = await fetch(`/api/bookings/${cancellingId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "cancelled" }),
      });

      const result = await response.json();

      if (result.ok) {
        toast({
          title: "Booking Cancelled",
          description: "Your booking has been cancelled successfully.",
        });
        fetchBookings();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to cancel booking.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An error occurred while cancelling the booking.",
        variant: "destructive",
      });
    } finally {
      setCancellingId(null);
      setShowCancelDialog(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const canCancel = (booking: Booking) => {
    return booking.status !== "cancelled" && booking.status !== "completed";
  };

  return (
    <DashboardLayout role="customer">
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          {["all", "pending", "accepted", "completed", "cancelled"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-xl text-xs font-medium capitalize transition-colors ${
                filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-muted"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading bookings...</div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar size={48} className="mx-auto mb-4 opacity-50" />
            <p>No bookings found.</p>
          </div>
        ) : (
          <div className="rounded-2xl bg-secondary border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground text-xs">ID</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground text-xs">Service</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground text-xs hidden md:table-cell">Vendor</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground text-xs hidden sm:table-cell">Date & Time</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground text-xs">Price</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground text-xs">Status</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground text-xs">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b, i) => (
                  <motion.tr
                    key={b.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-5 py-3 text-foreground font-mono text-xs">#{b.id}</td>
                    <td className="px-5 py-3 text-foreground">{b.service_title}</td>
                    <td className="px-5 py-3 text-muted-foreground hidden md:table-cell">{b.vendor_display_name}</td>
                    <td className="px-5 py-3 text-muted-foreground hidden sm:table-cell">
                      {formatDate(b.slot_date)} {b.slot_start_time}
                    </td>
                    <td className="px-5 py-3 text-foreground font-medium">${b.service_price}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[b.status] || "bg-gray-500/10 text-gray-400 border-gray-500/20"}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {canCancel(b) && (
                        <button
                          onClick={() => {
                            setCancellingId(b.id);
                            setShowCancelDialog(true);
                          }}
                          className="text-red-400 hover:text-red-300 transition-colors"
                          title="Cancel booking"
                        >
                          <XCircle size={18} />
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to cancel this booking? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setCancellingId(null)}>Keep Booking</AlertDialogCancel>
              <AlertDialogAction onClick={handleCancelBooking} className="bg-red-500 hover:bg-red-600">
                Cancel Booking
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
