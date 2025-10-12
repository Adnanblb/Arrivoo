import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, ArrowLeft, Download, Eye, Calendar as CalendarIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { RegistrationContract } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const searchSchema = z.object({
  guestName: z.string().optional(),
  roomNumber: z.string().optional(),
  reservationNumber: z.string().optional(),
});

type SearchForm = z.infer<typeof searchSchema>;

export default function ContractSearch() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [contracts, setContracts] = useState<RegistrationContract[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedContract, setSelectedContract] = useState<RegistrationContract | null>(null);

  const form = useForm<SearchForm>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      guestName: "",
      roomNumber: "",
      reservationNumber: "",
    },
  });

  const handleSearch = async (data: SearchForm) => {
    setIsLoading(true);
    const params = new URLSearchParams();
    params.append("hotelId", "89e84b73-cca7-4bd4-9dba-af421b2805f6"); // Mock hotel ID

    if (data.guestName) params.append("guestName", data.guestName);
    if (data.roomNumber) params.append("roomNumber", data.roomNumber);
    if (data.reservationNumber) params.append("reservationNumber", data.reservationNumber);

    try {
      const response = await apiRequest("GET", `/api/contracts/search?${params.toString()}`);
      const results = await response.json() as RegistrationContract[];
      
      setContracts(results);
      
      if (results.length === 0) {
        toast({
          title: "No Results",
          description: "No contracts found matching your search criteria",
        });
      } else {
        toast({
          title: "Search Complete",
          description: `Found ${results.length} contract(s)`,
        });
      }
    } catch (error) {
      setContracts([]);
      toast({
        title: "Search Failed",
        description: "Failed to search contracts",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewContract = (contract: RegistrationContract) => {
    setSelectedContract(contract);
  };

  const handleDownloadPDF = async (contractId: string) => {
    try {
      const response = await apiRequest("GET", `/api/contracts/${contractId}/pdf`);
      
      if (!response.ok) {
        throw new Error("Failed to download PDF");
      }

      // Get the PDF as a blob
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `contract-${contractId}.pdf`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Download Started",
        description: "Your contract PDF is being downloaded",
      });
    } catch (error) {
      console.error("PDF download error:", error);
      toast({
        title: "Download Failed",
        description: "Failed to download contract PDF",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/hotel")}
            className="mb-4"
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Contract Search</h1>
          <p className="text-muted-foreground mt-1">
            Search for registration contracts by guest name, room number, or reservation number
          </p>
        </div>

        {/* Search Form */}
        <Card className="mb-6" data-testid="card-search-form">
          <CardHeader>
            <CardTitle>Search Criteria</CardTitle>
            <CardDescription>
              Enter at least one search criterion to find contracts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(handleSearch)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="guestName">Guest Name</Label>
                  <Input
                    id="guestName"
                    data-testid="input-guest-name"
                    placeholder="e.g., John Smith"
                    {...form.register("guestName")}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roomNumber">Room Number</Label>
                  <Input
                    id="roomNumber"
                    data-testid="input-room-number"
                    placeholder="e.g., 302"
                    {...form.register("roomNumber")}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reservationNumber">Reservation Number</Label>
                  <Input
                    id="reservationNumber"
                    data-testid="input-reservation-number"
                    placeholder="e.g., RES-2024-001"
                    {...form.register("reservationNumber")}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={isLoading}
                  data-testid="button-search"
                  className="gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4" />
                      Search
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    form.reset();
                    setContracts([]);
                  }}
                  data-testid="button-clear"
                >
                  Clear
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Results Table */}
        {contracts.length > 0 && (
          <Card data-testid="card-results">
            <CardHeader>
              <CardTitle>Search Results</CardTitle>
              <CardDescription>Found {contracts.length} contract(s)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Guest Name</TableHead>
                      <TableHead>Reservation #</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Check-in</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contracts.map((contract) => (
                      <TableRow key={contract.id} data-testid={`row-contract-${contract.id}`}>
                        <TableCell className="font-medium">
                          {contract.guestName}
                        </TableCell>
                        <TableCell>{contract.reservationNumber}</TableCell>
                        <TableCell>{contract.roomNumber}</TableCell>
                        <TableCell>{contract.arrivalDate}</TableCell>
                        <TableCell>
                          <Badge variant={contract.status === "completed" ? "default" : "secondary"}>
                            {contract.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewContract(contract)}
                              data-testid={`button-view-${contract.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDownloadPDF(contract.id)}
                              data-testid={`button-download-${contract.id}`}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile View */}
              <div className="md:hidden space-y-4">
                {contracts.map((contract) => (
                  <Card key={contract.id} data-testid={`card-contract-${contract.id}`}>
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{contract.guestName}</p>
                            <p className="text-sm text-muted-foreground">
                              {contract.reservationNumber}
                            </p>
                          </div>
                          <Badge variant={contract.status === "completed" ? "default" : "secondary"}>
                            {contract.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <p>Room: {contract.roomNumber}</p>
                          <p>Check-in: {contract.arrivalDate}</p>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewContract(contract)}
                            className="flex-1"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadPDF(contract.id)}
                            className="flex-1"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Contract Details Dialog */}
      {selectedContract && (
        <Dialog open={!!selectedContract} onOpenChange={(open) => !open && setSelectedContract(null)}>
          <DialogContent data-testid="dialog-contract-details" className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">Registration Contract</DialogTitle>
              <DialogDescription>Contract ID: {selectedContract.id}</DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Guest Name</Label>
                  <p className="font-medium">{selectedContract.guestName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{selectedContract.email || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Phone</Label>
                  <p className="font-medium">{selectedContract.phone || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">ID Number</Label>
                  <p className="font-medium">{selectedContract.idNumber || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Reservation Number</Label>
                  <p className="font-medium">{selectedContract.reservationNumber}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Room</Label>
                  <p className="font-medium">{selectedContract.roomNumber}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Check-in Date</Label>
                  <p className="font-medium">{selectedContract.arrivalDate}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Check-out Date</Label>
                  <p className="font-medium">{selectedContract.departureDate}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Number of Nights</Label>
                  <p className="font-medium">{selectedContract.numberOfNights}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">PMS Source</Label>
                  <p className="font-medium">{selectedContract.pmsSource || "Manual"}</p>
                </div>
              </div>

              {selectedContract.signatureDataUrl && (
                <div>
                  <Label className="text-muted-foreground mb-2 block">Guest Signature</Label>
                  <div className="border rounded-lg p-4 bg-muted/20">
                    <img
                      src={selectedContract.signatureDataUrl}
                      alt="Guest signature"
                      className="max-h-32 mx-auto"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => handleDownloadPDF(selectedContract.id)}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedContract(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
