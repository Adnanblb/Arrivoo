import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Building2, Users, Plus, Pencil, Trash2, Hotel, UserPlus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminPortal() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isHotelDialogOpen, setIsHotelDialogOpen] = useState(false);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState<any>(null);
  const [editingUser, setEditingUser] = useState<any>(null);

  // Redirect if not admin
  if (user && user.role !== "admin") {
    setLocation("/hotel");
    return null;
  }

  // Fetch all hotels
  const { data: hotels, isLoading: hotelsLoading } = useQuery({
    queryKey: ["/api/admin/hotels"],
    enabled: user?.role === "admin",
  });

  // Fetch all users
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: user?.role === "admin",
  });

  // Hotel mutations
  const createHotelMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/admin/hotels", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hotels"] });
      setIsHotelDialogOpen(false);
      toast({ title: "Hotel created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateHotelMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PUT", `/api/admin/hotels/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hotels"] });
      setIsHotelDialogOpen(false);
      setEditingHotel(null);
      toast({ title: "Hotel updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteHotelMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/admin/hotels/${id}`, {});
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hotels"] });
      toast({ title: "Hotel deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // User mutations
  const createUserMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/admin/users", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsUserDialogOpen(false);
      toast({ title: "User created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PUT", `/api/admin/users/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsUserDialogOpen(false);
      setEditingUser(null);
      toast({ title: "User updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/admin/users/${id}`, {});
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleHotelSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      address: formData.get("address") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
      logoUrl: formData.get("logoUrl") as string || null,
      maxVisibleReservations: parseInt(formData.get("maxVisibleReservations") as string) || 50,
    };

    if (editingHotel) {
      updateHotelMutation.mutate({ id: editingHotel.id, data });
    } else {
      createHotelMutation.mutate(data);
    }
  };

  const handleUserSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const hotelIdValue = formData.get("hotelId") as string;
    const data: any = {
      email: formData.get("email") as string,
      hotelName: formData.get("hotelName") as string,
      role: formData.get("role") as string,
      hotelId: hotelIdValue === "none" ? null : hotelIdValue,
      firstName: formData.get("firstName") as string || null,
      lastName: formData.get("lastName") as string || null,
      address: formData.get("address") as string || null,
      company: formData.get("company") as string || null,
      vatNumber: formData.get("vatNumber") as string || null,
    };

    // Only include password if provided
    const password = formData.get("password") as string;
    if (password) {
      data.password = password;
    }

    if (editingUser) {
      updateUserMutation.mutate({ id: editingUser.id, data });
    } else {
      // Password is required for new users
      if (!password) {
        toast({ title: "Error", description: "Password is required for new users", variant: "destructive" });
        return;
      }
      createUserMutation.mutate(data);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-admin-portal-title">Admin Portal</h1>
          <p className="text-muted-foreground">Manage hotels and users across the platform</p>
        </div>
        <Button
          variant="outline"
          onClick={() => setLocation("/hotel")}
          data-testid="button-back-to-dashboard"
        >
          Back to Dashboard
        </Button>
      </div>

      <Tabs defaultValue="hotels" className="space-y-4">
        <TabsList>
          <TabsTrigger value="hotels" data-testid="tab-hotels">
            <Building2 className="w-4 h-4 mr-2" />
            Hotels
          </TabsTrigger>
          <TabsTrigger value="users" data-testid="tab-users">
            <Users className="w-4 h-4 mr-2" />
            Users
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hotels" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Hotels</CardTitle>
                  <CardDescription>Manage all hotels in the system</CardDescription>
                </div>
                <Dialog open={isHotelDialogOpen} onOpenChange={(open) => {
                  setIsHotelDialogOpen(open);
                  if (!open) setEditingHotel(null);
                }}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-hotel">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Hotel
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingHotel ? "Edit Hotel" : "Add New Hotel"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleHotelSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Hotel Name</Label>
                        <Input
                          id="name"
                          name="name"
                          defaultValue={editingHotel?.name}
                          required
                          data-testid="input-hotel-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Input
                          id="address"
                          name="address"
                          defaultValue={editingHotel?.address}
                          data-testid="input-hotel-address"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          name="phone"
                          defaultValue={editingHotel?.phone}
                          data-testid="input-hotel-phone"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          defaultValue={editingHotel?.email}
                          data-testid="input-hotel-email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="logoUrl">Logo URL</Label>
                        <Input
                          id="logoUrl"
                          name="logoUrl"
                          type="url"
                          placeholder="https://example.com/logo.png"
                          defaultValue={editingHotel?.logoUrl}
                          data-testid="input-hotel-logo-url"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maxVisibleReservations">Max Visible Reservations</Label>
                        <Input
                          id="maxVisibleReservations"
                          name="maxVisibleReservations"
                          type="number"
                          defaultValue={editingHotel?.maxVisibleReservations || 50}
                          data-testid="input-hotel-max-reservations"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsHotelDialogOpen(false);
                            setEditingHotel(null);
                          }}
                          data-testid="button-cancel-hotel"
                        >
                          Cancel
                        </Button>
                        <Button type="submit" data-testid="button-save-hotel">
                          {editingHotel ? "Update" : "Create"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {hotelsLoading ? (
                <div className="text-center py-8">Loading hotels...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Max Reservations</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.isArray(hotels) && hotels.map((hotel: any) => (
                      <TableRow key={hotel.id} data-testid={`row-hotel-${hotel.id}`}>
                        <TableCell>{hotel.name}</TableCell>
                        <TableCell>{hotel.address || "-"}</TableCell>
                        <TableCell>{hotel.phone || "-"}</TableCell>
                        <TableCell>{hotel.email || "-"}</TableCell>
                        <TableCell>{hotel.maxVisibleReservations || 50}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingHotel(hotel);
                                setIsHotelDialogOpen(true);
                              }}
                              data-testid={`button-edit-hotel-${hotel.id}`}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (confirm("Are you sure you want to delete this hotel?")) {
                                  deleteHotelMutation.mutate(hotel.id);
                                }
                              }}
                              data-testid={`button-delete-hotel-${hotel.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Users</CardTitle>
                  <CardDescription>Manage all users in the system</CardDescription>
                </div>
                <Dialog open={isUserDialogOpen} onOpenChange={(open) => {
                  setIsUserDialogOpen(open);
                  if (!open) setEditingUser(null);
                }}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-user">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add User
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUserSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            name="firstName"
                            defaultValue={editingUser?.firstName}
                            data-testid="input-user-first-name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            name="lastName"
                            defaultValue={editingUser?.lastName}
                            data-testid="input-user-last-name"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="user-email">Email</Label>
                        <Input
                          id="user-email"
                          name="email"
                          type="email"
                          defaultValue={editingUser?.email}
                          required
                          data-testid="input-user-email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password {editingUser && "(leave blank to keep current)"}</Label>
                        <Input
                          id="password"
                          name="password"
                          type="password"
                          required={!editingUser}
                          data-testid="input-user-password"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Input
                          id="address"
                          name="address"
                          defaultValue={editingUser?.address}
                          data-testid="input-user-address"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="company">Company</Label>
                          <Input
                            id="company"
                            name="company"
                            defaultValue={editingUser?.company}
                            data-testid="input-user-company"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="vatNumber">VAT Number</Label>
                          <Input
                            id="vatNumber"
                            name="vatNumber"
                            defaultValue={editingUser?.vatNumber}
                            data-testid="input-user-vat-number"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="hotelName">Hotel Name</Label>
                        <Input
                          id="hotelName"
                          name="hotelName"
                          defaultValue={editingUser?.hotelName}
                          required
                          data-testid="input-user-hotel-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select name="role" defaultValue={editingUser?.role || "hotel_staff"}>
                          <SelectTrigger data-testid="select-user-role">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="hotel_staff">Hotel Staff</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="hotelId">Hotel</Label>
                        <Select name="hotelId" defaultValue={editingUser?.hotelId || "none"}>
                          <SelectTrigger data-testid="select-user-hotel">
                            <SelectValue placeholder="Select hotel (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {Array.isArray(hotels) && hotels.map((hotel: any) => (
                              <SelectItem key={hotel.id} value={hotel.id}>
                                {hotel.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsUserDialogOpen(false);
                            setEditingUser(null);
                          }}
                          data-testid="button-cancel-user"
                        >
                          Cancel
                        </Button>
                        <Button type="submit" data-testid="button-save-user">
                          {editingUser ? "Update" : "Create"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="text-center py-8">Loading users...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Hotel Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.isArray(users) && users.map((userItem: any) => (
                      <TableRow key={userItem.id} data-testid={`row-user-${userItem.id}`}>
                        <TableCell>
                          {userItem.firstName || userItem.lastName 
                            ? `${userItem.firstName || ''} ${userItem.lastName || ''}`.trim()
                            : '-'}
                        </TableCell>
                        <TableCell>{userItem.email}</TableCell>
                        <TableCell>{userItem.company || "-"}</TableCell>
                        <TableCell>{userItem.hotelName}</TableCell>
                        <TableCell>
                          <span className={userItem.role === "admin" ? "font-semibold text-primary" : ""}>
                            {userItem.role}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingUser(userItem);
                                setIsUserDialogOpen(true);
                              }}
                              data-testid={`button-edit-user-${userItem.id}`}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (confirm("Are you sure you want to delete this user?")) {
                                  deleteUserMutation.mutate(userItem.id);
                                }
                              }}
                              disabled={userItem.id === user?.id}
                              data-testid={`button-delete-user-${userItem.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
