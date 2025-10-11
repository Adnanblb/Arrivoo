import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SignaturePad } from "@/components/SignaturePad";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Building2 } from "lucide-react";

const checkinSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  reservationNumber: z.string().min(5, "Reservation number is required"),
  mobileNumber: z.string().min(10, "Valid mobile number is required"),
  email: z.string().email("Valid email is required"),
  checkInDate: z.string().min(1, "Check-in date is required"),
  checkOutDate: z.string().min(1, "Check-out date is required"),
  numberOfNights: z.string().min(1, "Number of nights is required"),
  roomType: z.string().min(1, "Room type is required"),
});

type CheckinForm = z.infer<typeof checkinSchema>;

export default function GuestCheckin() {
  const [signature, setSignature] = useState<string>("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<CheckinForm>({
    resolver: zodResolver(checkinSchema),
    defaultValues: {
      fullName: "John Smith",
      reservationNumber: "RES-2024-001",
      mobileNumber: "+1 (555) 123-4567",
      email: "john.smith@example.com",
      checkInDate: "2025-10-11",
      checkOutDate: "2025-10-15",
      numberOfNights: "4",
      roomType: "Suite",
    },
  });

  const onSubmit = (data: CheckinForm) => {
    if (!signature) {
      alert("Please provide your signature");
      return;
    }
    console.log("Form submitted:", data);
    console.log("Signature:", signature.substring(0, 50) + "...");
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-12 pb-8 text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-chart-2/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-chart-2" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold" data-testid="text-success-title">
                Check-in Complete!
              </h2>
              <p className="text-muted-foreground">
                Your registration has been successfully submitted. You'll receive a
                confirmation email shortly.
              </p>
            </div>
            <div className="pt-4">
              <p className="text-sm text-muted-foreground">
                Redirecting to confirmation page in 5 seconds...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">
            Express Check-in
          </h1>
          <p className="text-muted-foreground mt-2">
            Complete your registration before arrival
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Guest Information</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-full-name"
                            placeholder="Enter your full name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reservationNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reservation Number</FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-reservation-number"
                            placeholder="RES-XXXX-XXX"
                            className="font-mono"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="mobileNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mobile Number</FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-mobile"
                            type="tel"
                            placeholder="+1 (555) 000-0000"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-email"
                            type="email"
                            placeholder="you@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="checkInDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Check-in Date</FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-checkin-date"
                            type="date"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="checkOutDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Check-out Date</FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-checkout-date"
                            type="date"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="numberOfNights"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Nights</FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-nights"
                            type="number"
                            min="1"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="roomType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Room Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-room-type">
                              <SelectValue placeholder="Select room type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Standard">Standard Room</SelectItem>
                            <SelectItem value="Deluxe">Deluxe Room</SelectItem>
                            <SelectItem value="Suite">Suite</SelectItem>
                            <SelectItem value="Presidential">Presidential Suite</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <FormLabel>Digital Signature</FormLabel>
                  <p className="text-sm text-muted-foreground mb-2">
                    Please sign below to confirm your registration
                  </p>
                  <SignaturePad onSave={setSignature} />
                  {signature && (
                    <p className="text-sm text-chart-2 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      Signature captured
                    </p>
                  )}
                </div>

                <Button
                  data-testid="button-submit-checkin"
                  type="submit"
                  className="w-full"
                  size="lg"
                >
                  Complete Check-in
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
