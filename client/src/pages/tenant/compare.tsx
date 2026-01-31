import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { MapPin, Bed, Bath, Square, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ComparePropertiesPage() {
  const [, setLocation] = useLocation();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  
  // Get property IDs from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ids = params.get('ids');
    if (ids) {
      setSelectedIds(ids.split(',').map(Number));
    }
  }, []);
  
  // Fetch properties
  const { data: properties = [] } = trpc.properties.getSaved.useQuery();
  
  const compareProperties = properties
    .filter((p: any) => selectedIds.includes(p.property.id))
    .map((p: any) => p.property);
  
  if (compareProperties.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">No Properties Selected</h2>
            <p className="text-muted-foreground mb-6">Please select 2-3 properties from your saved list to compare.</p>
            <Button onClick={() => setLocation('/tenant/saved-properties')}>
              Go to Saved Properties
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  const features = [
    { key: 'bedrooms', label: 'Bedrooms', icon: Bed },
    { key: 'bathrooms', label: 'Bathrooms', icon: Bath },
    { key: 'squareFeet', label: 'Square Feet', icon: Square },
  ];
  
  const amenitiesList = Array.from(
    new Set(compareProperties.flatMap((p: any) => 
      Array.isArray(p.amenities) ? (p.amenities as string[]) : []
    ))
  ) as string[];
  
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Compare Properties</h1>
          <p className="text-muted-foreground">Side-by-side comparison of your selected properties</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="text-left p-4 bg-slate-50 font-semibold text-slate-700 w-48">Feature</th>
                {compareProperties.map((property: any) => (
                  <th key={property.id} className="p-4 bg-slate-50">
                    <div className="text-left">
                      {property.images && Array.isArray(property.images) && property.images.length > 0 ? (
                        <img 
                          src={String(property.images[0])} 
                          alt={property.title}
                          className="w-full h-32 object-cover rounded-lg mb-3"
                        />
                      ) : null}
                      <h3 className="font-bold text-slate-900 mb-1">{property.title}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {property.city}, {property.country}
                      </p>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Price */}
              <tr className="border-b border-slate-200">
                <td className="p-4 font-medium text-slate-700">Monthly Rent</td>
                {compareProperties.map((property: any) => (
                  <td key={property.id} className="p-4">
                    <span className="text-2xl font-bold text-cyan-600">
                      €{property.rentPrice}
                    </span>
                    <span className="text-muted-foreground">/mo</span>
                  </td>
                ))}
              </tr>
              
              {/* Features */}
              {features.map((feature: any) => (
                <tr key={feature.key} className="border-b border-slate-200">
                  <td className="p-4 font-medium text-slate-700 flex items-center gap-2">
                    <feature.icon className="h-4 w-4" />
                    {feature.label}
                  </td>
                  {compareProperties.map((property: any) => (
                  <td key={property.id} className="p-4 text-slate-900">
                    {String(property[feature.key as keyof typeof property] || 'N/A')}
                  </td>
                  ))}
                </tr>
              ))}
              
              {/* Address */}
              <tr className="border-b border-slate-200">
                <td className="p-4 font-medium text-slate-700">Address</td>
                {compareProperties.map((property: any) => (
                  <td key={property.id} className="p-4 text-sm text-muted-foreground">
                    {property.address}
                  </td>
                ))}
              </tr>
              
              {/* Amenities */}
              {amenitiesList.map((amenity: string) => (
                <tr key={amenity} className="border-b border-slate-200">
                  <td className="p-4 font-medium text-slate-700">{amenity}</td>
                  {compareProperties.map((property: any) => {
                    const hasAmenity = Array.isArray(property.amenities) && 
                      property.amenities.includes(amenity);
                    return (
                      <td key={property.id} className="p-4">
                        <div>
                          {hasAmenity ? (
                            <Check className="h-5 w-5 text-green-600" />
                          ) : (
                            <X className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
              
              {/* Actions */}
              <tr>
                <td className="p-4 font-medium text-slate-700">Actions</td>
                {compareProperties.map((property: any) => (
                  <td key={property.id} className="p-4">
                    <div className="space-y-2">
                      <Button 
                        className="w-full"
                        onClick={() => setLocation(`/property/${property.id}`)}
                      >
                        View Details
                      </Button>
                      <Button 
                        variant="outline"
                        className="w-full"
                        onClick={() => setLocation(`/apply/${property.id}`)}
                      >
                        Apply Now
                      </Button>
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
