import { motion } from "framer-motion";
import { Plus, Calendar, Clock, Trash2 } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AvailabilitySlot = {
  id: number;
  vendorId: number;
  slotDate: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
};

export default function VendorServices() {
  const { toast } = useToast();
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [showAddSlotDialog, setShowAddSlotDialog] = useState(false);
  const [slotDate, setSlotDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = async () => {
    setLoadingSlots(true);
    try {
      const response = await fetch("/api/availability", {
        credentials: "include",
      });
      const result = await response.json();

      if (result.ok) {
        setSlots(result.slots);
      }
    } catch (err) {
      console.error("Failed to fetch slots:", err);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!slotDate || !startTime || !endTime) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          slotDate,
          startTime,
          endTime,
        }),
      });

      const result = await response.json();

      if (result.ok) {
        toast({
          title: "Success",
          description: "Availability slot created successfully.",
        });
        setShowAddSlotDialog(false);
        setSlotDate("");
        setStartTime("");
        setEndTime("");
        fetchSlots();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create slot.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An error occurred while creating the slot.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSlot = async (slotId: number) => {
    try {
      const response = await fetch(`/api/availability/${slotId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const result = await response.json();

      if (result.ok) {
        toast({
          title: "Success",
          description: "Availability slot deleted successfully.",
        });
        fetchSlots();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete slot.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An error occurred while deleting the slot.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <DashboardLayout role="vendor">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-semibold text-foreground">Availability Slots</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your availability. Customers can book any of your services during these time slots.
            </p>
          </div>
          <Dialog open={showAddSlotDialog} onOpenChange={setShowAddSlotDialog}>
            <DialogTrigger asChild>
              <Button className="inline-flex items-center gap-2">
                <Plus size={16} /> Add Time Slot
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Availability Slot</DialogTitle>
                <DialogDescription>
                  Create a new time slot for your availability. Customers will be able to book any of your services during this time.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddSlot} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={slotDate}
                    onChange={(e) => setSlotDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setShowAddSlotDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Creating..." : "Create Slot"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loadingSlots ? (
          <div className="text-center py-12 text-muted-foreground">Loading slots...</div>
        ) : slots.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar size={48} className="mx-auto mb-4 opacity-50" />
            <p>No availability slots created yet.</p>
            <p className="text-xs mt-2">Click "Add Time Slot" to create one.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {slots.map((slot, i) => (
              <motion.div
                key={slot.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`rounded-xl border p-4 ${
                  slot.isAvailable
                    ? "bg-green-500/5 border-green-500/20"
                    : "bg-gray-500/5 border-gray-500/20"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-primary" />
                    <span className="text-sm font-medium text-foreground">{formatDate(slot.slotDate)}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteSlot(slot.id)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                    title="Delete slot"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock size={14} />
                  <span>
                    {slot.startTime} - {slot.endTime}
                  </span>
                </div>
                <div className="mt-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border ${
                      slot.isAvailable
                        ? "bg-green-500/10 text-green-400 border-green-500/20"
                        : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                    }`}
                  >
                    {slot.isAvailable ? "Available" : "Booked"}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
