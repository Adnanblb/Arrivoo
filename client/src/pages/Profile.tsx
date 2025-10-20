import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, Building2, Mail, MapPin, Briefcase, Hash } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", "/api/profile", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setIsEditing(false);
      toast({ title: "Profile updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      firstName: formData.get("firstName") as string || null,
      lastName: formData.get("lastName") as string || null,
      address: formData.get("address") as string || null,
      company: formData.get("company") as string || null,
      vatNumber: formData.get("vatNumber") as string || null,
    };
    updateProfileMutation.mutate(data);
  };

  if (!user) {
    return <div className="container mx-auto p-6">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile
          </CardTitle>
          <CardDescription>View and update your personal information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  defaultValue={(user as any).firstName || ""}
                  disabled={!isEditing}
                  data-testid="input-profile-first-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  defaultValue={(user as any).lastName || ""}
                  disabled={!isEditing}
                  data-testid="input-profile-last-name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </Label>
              <Input
                id="email"
                value={user.email}
                disabled
                className="bg-muted"
                data-testid="input-profile-email"
              />
              <p className="text-sm text-muted-foreground">Email cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Address
              </Label>
              <Input
                id="address"
                name="address"
                defaultValue={(user as any).address || ""}
                disabled={!isEditing}
                data-testid="input-profile-address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company" className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Company
              </Label>
              <Input
                id="company"
                name="company"
                defaultValue={(user as any).company || ""}
                disabled={!isEditing}
                data-testid="input-profile-company"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vatNumber" className="flex items-center gap-2">
                <Hash className="w-4 h-4" />
                VAT Number
              </Label>
              <Input
                id="vatNumber"
                name="vatNumber"
                defaultValue={(user as any).vatNumber || ""}
                disabled={!isEditing}
                data-testid="input-profile-vat-number"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Hotel
              </Label>
              <Input
                value={user.hotelName}
                disabled
                className="bg-muted"
                data-testid="input-profile-hotel-name"
              />
              <p className="text-sm text-muted-foreground">Hotel assignment cannot be changed</p>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              {!isEditing ? (
                <Button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  data-testid="button-edit-profile"
                >
                  Edit Profile
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    data-testid="button-cancel-profile"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    data-testid="button-save-profile"
                  >
                    {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
