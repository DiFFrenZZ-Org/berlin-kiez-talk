import { useState } from "react";
import { MessageCircle, ThumbsUp, MapPin, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const ForumList = () => {
  const berlinDistricts = [
    "Alle Bezirke",
    "Mitte",
    "Friedrichshain-Kreuzberg",
    "Pankow",
    "Charlottenburg-Wilmersdorf",
    "Spandau",
    "Steglitz-Zehlendorf",
    "Tempelhof-Schöneberg",
    "Neukölln",
    "Treptow-Köpenick",
    "Marzahn-Hellersdorf",
    "Lichtenberg",
    "Reinickendorf",
  ];

  const [selectedDistrict, setSelectedDistrict] = useState<string>("Alle Bezirke");

  /* -------------------------------- Mock data --------------------------- */
  const mockTopics = [
    {
      id: "1",
      title: "Suche Fahrradreparatur in Kreuzberg",
      author: "berliner_cyclist",
      district: "Friedrichshain-Kreuzberg",
      replies: 12,
      likes: 8,
      timestamp: "2 Std.",
      isHot: true,
    },
    {
      id: "2",
      title: "Empfehlung für gute Pizza in Prenzlauer Berg",
      author: "foodie_123",
      district: "Pankow",
      replies: 25,
      likes: 34,
      timestamp: "5 Std.",
      isHot: true,
    },
    {
      id: "3",
      title: "Tauschbörse für Bücher in Mitte",
      author: "book_lover",
      district: "Mitte",
      replies: 7,
      likes: 15,
      timestamp: "1 Tag",
      isHot: false,
    },
    {
      id: "4",
      title: "Yoga-Gruppe in Charlottenburg sucht Mitglieder",
      author: "zen_master",
      district: "Charlottenburg-Wilmersdorf",
      replies: 18,
      likes: 22,
      timestamp: "2 Tage",
      isHot: false,
    },
  ];

  const filteredTopics =
    selectedDistrict === "Alle Bezirke"
      ? mockTopics
      : mockTopics.filter((t) => t.district === selectedDistrict);

  /* -------------------------------- JSX --------------------------------- */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Berlin Forum</h2>
          <p className="text-blue-200">Diskutieren Sie mit Ihrer Nachbarschaft</p>
        </div>
        <Button className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Neues Thema
        </Button>
      </div>

      {/* District filter */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {berlinDistricts.map((d) => (
              <Button
                key={d}
                size="sm"
                variant={selectedDistrict === d ? "default" : "outline"}
                onClick={() => setSelectedDistrict(d)}
                className={
                  selectedDistrict === d
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "border-white/20 text-blue-200 hover:text-white hover:bg-white/10"
                }
              >
                {d}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Topic list */}
      <div className="space-y-4">
        {filteredTopics.map((topic) => (
          <Card
            key={topic.id}
            className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/15 transition-colors cursor-pointer"
          >
            <CardContent className="p-4">
              <div className="space-y-2">
                {/* Title row */}
                <div className="flex items-center gap-2">
                  {topic.isHot && (
                    <Badge className="bg-red-500 text-white text-xs">Hot</Badge>
                  )}
                  <h3 className="font-semibold hover:text-blue-300 transition-colors">
                    {topic.title}
                  </h3>
                </div>

                {/* Meta row */}
                <div className="flex items-center gap-4 text-sm text-blue-200">
                  <span>von {topic.author}</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {topic.district}
                  </span>
                  <span>{topic.timestamp}</span>
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-blue-300">
                    <MessageCircle className="h-4 w-4" />
                    {topic.replies} Antworten
                  </span>
                  <span className="flex items-center gap-1 text-green-300">
                    <ThumbsUp className="h-4 w-4" />
                    {topic.likes}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty state */}
      {filteredTopics.length === 0 && (
        <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
          <CardContent className="p-8 text-center">
            <p className="text-blue-200">Keine Themen in diesem Bezirk gefunden.</p>
            <Button className="mt-4 bg-green-600 hover:bg-green-700">
              Erstes Thema erstellen
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
