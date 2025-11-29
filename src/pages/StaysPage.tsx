import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getStays, type Stay } from "@/lib/stayService";
import { Search, Loader2, Calendar } from "lucide-react";
import { CreateStayDialog } from "@/components/CreateStayDialog";
import { EditStayDialog } from "@/components/EditStayDialog";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parseLocalDate } from "@/lib/utils";

export function StaysPage() {
  const [stays, setStays] = useState<Stay[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const navigate = useNavigate();

  useEffect(() => {
    loadStays();
  }, [search, statusFilter]);

  const loadStays = async () => {
    setLoading(true);
    const { data } = await getStays();
    if (data) {
      let filtered = data;
      
      // Apply search filter
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(
          (stay) =>
            stay.client?.name?.toLowerCase().includes(searchLower) ||
            stay.accommodation?.name?.toLowerCase().includes(searchLower) ||
            stay.arrival_date.includes(search) ||
            stay.departure_date.includes(search)
        );
      }

      // Apply status filter
      if (statusFilter !== "all") {
        filtered = filtered.filter((stay) => stay.status === statusFilter);
      }

      setStays(filtered);
    }
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    return parseLocalDate(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (status: Stay["status"]) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "checked-in":
        return "bg-blue-100 text-blue-800";
      case "checked-out":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  return (
    <Layout>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold tracking-wide uppercase">Stays</h1>
          <CreateStayDialog onStayCreated={loadStays} />
        </div>

        <div className="flex gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search stays..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="checked-in">Checked In</SelectItem>
              <SelectItem value="checked-out">Checked Out</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Accommodation</TableHead>
                  <TableHead>Arrival</TableHead>
                  <TableHead>Departure</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stays.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No stays found
                    </TableCell>
                  </TableRow>
                ) : (
                  stays.map((stay) => (
                    <TableRow
                      key={stay.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => navigate(`/stays/${stay.id}`)}
                    >
                      <TableCell className="font-medium">
                        {stay.client?.name || "Unknown"}
                      </TableCell>
                      <TableCell>{stay.accommodation?.name || "Unknown"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatDate(stay.arrival_date)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatDate(stay.departure_date)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(stay.status)}`}
                        >
                          {stay.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <EditStayDialog stay={stay} onStayUpdated={loadStays} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </Layout>
  );
}

