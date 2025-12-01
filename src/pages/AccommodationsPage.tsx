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
import { getAccommodations, searchAccommodations, deleteAccommodation, type Accommodation } from "@/lib/accommodationService";
import { Search, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

import { CreateAccommodationDialog } from "@/components/CreateAccommodationDialog";
import { EditAccommodationDialog } from "@/components/EditAccommodationDialog";

export function AccommodationsPage() {
  const { currentOrganization } = useAuth();
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (currentOrganization) {
      loadAccommodations();
    }
  }, [search, currentOrganization]);

  const loadAccommodations = async () => {
    if (!currentOrganization) return;
    
    setLoading(true);
    if (search) {
      const { data } = await searchAccommodations(currentOrganization.id, search);
      if (data) setAccommodations(data);
    } else {
      const { data } = await getAccommodations(currentOrganization.id);
      if (data) setAccommodations(data);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this accommodation?")) {
      await deleteAccommodation(id);
      loadAccommodations();
    }
  };

  return (
    <Layout>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold tracking-wide uppercase">Accommodations</h1>
          <CreateAccommodationDialog onAccommodationCreated={loadAccommodations} />
        </div>

        <div className="flex gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search accommodations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
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
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accommodations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No accommodations found
                    </TableCell>
                  </TableRow>
                ) : (
                  accommodations.map((acc) => (
                    <TableRow key={acc.id}>
                      <TableCell className="font-medium">{acc.name}</TableCell>
                      <TableCell className="capitalize">{acc.type}</TableCell>
                      <TableCell>{acc.capacity || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <EditAccommodationDialog accommodation={acc} onAccommodationUpdated={loadAccommodations} />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-600 gap-2"
                            onClick={() => handleDelete(acc.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </div>
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
