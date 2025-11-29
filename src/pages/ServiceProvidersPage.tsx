import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getServiceCategories,
  deleteServiceCategory,
} from "@/lib/serviceCategoryService";
import type { ServiceCategory } from "@/lib/serviceCategoryService";
import {
  getServiceProviders,
  deleteServiceProvider,
  searchServiceProviders
} from "@/lib/serviceProviderService";
import type { ServiceProvider } from "@/lib/serviceProviderService";
import { CreateServiceCategoryDialog } from "@/components/CreateServiceCategoryDialog";
import { EditServiceCategoryDialog } from "@/components/EditServiceCategoryDialog";
import { CreateServiceProviderDialog } from "@/components/CreateServiceProviderDialog";
import { EditServiceProviderDialog } from "@/components/EditServiceProviderDialog";
import { ManageContactsDialog } from "@/components/ManageContactsDialog";
import { ManageServicesDialog } from "@/components/ManageServicesDialog";
import { Edit, Trash2, Search, ExternalLink, Users, Package } from "lucide-react";
import { cn } from "@/lib/utils";

export function ServiceProvidersPage() {
  const [activeTab, setActiveTab] = useState<"providers" | "categories">("providers");

  return (
    <Layout>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-wide uppercase">Service Providers</h1>
            <p className="text-muted-foreground">
              Manage external service providers and their categories.
            </p>
          </div>
        </div>

        <div className="flex border-b mb-6">
          <button
            className={cn(
              "px-4 py-2 font-medium text-sm border-b-2 transition-colors",
              activeTab === "providers"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setActiveTab("providers")}
          >
            Providers
          </button>
          <button
            className={cn(
              "px-4 py-2 font-medium text-sm border-b-2 transition-colors",
              activeTab === "categories"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setActiveTab("categories")}
          >
            Categories
          </button>
        </div>

        {activeTab === "providers" ? <ProvidersTab /> : <CategoriesTab />}
      </div>
    </Layout>
  );
}

function ProvidersTab() {
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [search, setSearch] = useState("");
  const [editingProvider, setEditingProvider] = useState<ServiceProvider | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [contactsProvider, setContactsProvider] = useState<ServiceProvider | null>(null);
  const [contactsOpen, setContactsOpen] = useState(false);
  const [servicesProvider, setServicesProvider] = useState<ServiceProvider | null>(null);
  const [servicesOpen, setServicesOpen] = useState(false);

  const loadProviders = async () => {
    if (search) {
        const { data } = await searchServiceProviders(search);
        if (data) setProviders(data);
    } else {
        const { data } = await getServiceProviders();
        if (data) setProviders(data);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadProviders();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this provider?")) {
      await deleteServiceProvider(id);
      loadProviders();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search providers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <CreateServiceProviderDialog onProviderCreated={loadProviders} />
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Contact Info</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {providers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No providers found.
                </TableCell>
              </TableRow>
            ) : (
              providers.map((provider) => (
                <TableRow key={provider.id}>
                  <TableCell className="font-medium">
                    <div>{provider.name}</div>
                    {provider.website && (
                      <a 
                        href={provider.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                      >
                        {provider.website} <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </TableCell>
                  <TableCell>
                    {provider.service_categories?.name || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                        {provider.address}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                        provider.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      )}
                    >
                      {provider.is_active ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Manage Services"
                        onClick={() => {
                          setServicesProvider(provider);
                          setServicesOpen(true);
                        }}
                      >
                        <Package className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Manage Contacts"
                        onClick={() => {
                          setContactsProvider(provider);
                          setContactsOpen(true);
                        }}
                      >
                        <Users className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingProvider(provider);
                          setEditOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => handleDelete(provider.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <EditServiceProviderDialog
        provider={editingProvider}
        open={editOpen}
        onOpenChange={setEditOpen}
        onProviderUpdated={loadProviders}
      />

      <ManageContactsDialog
        providerId={contactsProvider?.id || null}
        providerName={contactsProvider?.name || ""}
        open={contactsOpen}
        onOpenChange={setContactsOpen}
      />

      <ManageServicesDialog
        providerId={servicesProvider?.id || null}
        providerName={servicesProvider?.name || ""}
        open={servicesOpen}
        onOpenChange={setServicesOpen}
      />
    </div>
  );
}

function CategoriesTab() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const loadCategories = async () => {
    const { data } = await getServiceCategories();
    if (data) setCategories(data);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this category?")) {
      await deleteServiceCategory(id);
      loadCategories();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <CreateServiceCategoryDialog onCategoryCreated={loadCategories} />
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Icon</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No categories found.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="text-xl">{category.icon}</TableCell>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {category.description}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingCategory(category);
                          setEditOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => handleDelete(category.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <EditServiceCategoryDialog
        category={editingCategory}
        open={editOpen}
        onOpenChange={setEditOpen}
        onCategoryUpdated={loadCategories}
      />
    </div>
  );
}

