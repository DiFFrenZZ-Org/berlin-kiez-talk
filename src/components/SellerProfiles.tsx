
import { Star, MapPin, CreditCard, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const SellerProfiles = () => {
  const mockSellers = [
    {
      id: '1',
      name: 'TechRepair_Berlin',
      service: 'Laptop & Smartphone Reparatur',
      district: 'Friedrichshain-Kreuzberg',
      rating: 4.8,
      reviews: 127,
      description: 'Professionelle Reparatur von elektronischen Geräten. Schnell, zuverlässig und fair.',
      subscriptionActive: true,
      responseTime: '< 2 Std.',
      tags: ['Elektronik', 'Reparatur', 'Schnell']
    },
    {
      id: '2',
      name: 'GreenThumb_Gardens',
      service: 'Gartenpflege & Beratung',
      district: 'Pankow',
      rating: 4.9,
      reviews: 89,
      description: 'Nachhaltige Gartenpflege und Beratung für Urban Gardening in Berlin.',
      subscriptionActive: true,
      responseTime: '< 4 Std.',
      tags: ['Garten', 'Nachhaltig', 'Beratung']
    },
    {
      id: '3',
      name: 'MoveMaster_Berlin',
      service: 'Umzugshilfe',
      district: 'Mitte',
      rating: 4.6,
      reviews: 203,
      description: 'Professionelle Umzugshilfe in ganz Berlin. Von Transport bis Einrichtung.',
      subscriptionActive: false,
      responseTime: '< 1 Tag',
      tags: ['Umzug', 'Transport', 'Hilfe']
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Verkäufer in Berlin</h2>
        <p className="text-blue-200">Entdecken Sie lokale Dienstleister in Ihrer Nähe</p>
      </div>

      {/* Sellers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockSellers.map((seller) => (
          <Card
            key={seller.id}
            className={`bg-white/10 backdrop-blur-md border-white/20 text-white transition-all hover:scale-105 ${
              seller.subscriptionActive 
                ? 'ring-2 ring-green-400/30' 
                : 'opacity-75'
            }`}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{seller.name}</CardTitle>
                  <CardDescription className="text-blue-200">
                    {seller.service}
                  </CardDescription>
                </div>
                {seller.subscriptionActive ? (
                  <Badge className="bg-green-600 text-white">
                    <CreditCard className="h-3 w-3 mr-1" />
                    Aktiv
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-red-400 text-red-300">
                    Inaktiv
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-blue-100">{seller.description}</p>
              
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="text-white">{seller.rating}</span>
                  <span className="text-blue-300">({seller.reviews})</span>
                </div>
                <div className="flex items-center space-x-1 text-blue-300">
                  <MapPin className="h-3 w-3" />
                  <span className="text-xs">{seller.district}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {seller.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="text-xs border-blue-400/30 text-blue-300"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="text-xs text-blue-300">
                Antwortzeit: {seller.responseTime}
              </div>

              <Button
                className={`w-full ${
                  seller.subscriptionActive
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-gray-600 hover:bg-gray-700"
                }`}
                disabled={!seller.subscriptionActive}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                {seller.subscriptionActive ? 'Nachricht senden' : 'Nicht verfügbar'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Information Box */}
      <Card className="bg-blue-600/20 backdrop-blur-md border-blue-400/30 text-white">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <CreditCard className="h-5 w-5 text-blue-300 mt-0.5" />
            <div>
              <h3 className="font-semibold mb-1">Verkäufer werden</h3>
              <p className="text-sm text-blue-200">
                Als Verkäufer benötigen Sie ein aktives monatliches Abonnement, um Nachrichten zu empfangen 
                und Ihre Dienste anzubieten. Grüne Rahmen zeigen aktive Verkäufer an.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
