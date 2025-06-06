
import { useState } from "react";
import { User, Store, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AuthFlowProps {
  onAuthComplete: (role: 'seller' | 'buyer') => void;
}

export const AuthFlow = ({ onAuthComplete }: AuthFlowProps) => {
  const [step, setStep] = useState<'role' | 'signup'>('role');
  const [selectedRole, setSelectedRole] = useState<'seller' | 'buyer' | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });

  const handleRoleSelect = (role: 'seller' | 'buyer') => {
    setSelectedRole(role);
    setStep('signup');
  };

  const handleSignup = () => {
    if (selectedRole && formData.username) {
      onAuthComplete(selectedRole);
    }
  };

  if (step === 'role') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg bg-white/10 backdrop-blur-md border-white/20 text-white">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Willkommen bei BerlinChat</CardTitle>
            <CardDescription className="text-blue-200">
              Wählen Sie Ihre Rolle, um fortzufahren
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={() => handleRoleSelect('buyer')}
                className="h-24 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-400/30 flex flex-col items-center justify-center space-y-2"
                variant="outline"
              >
                <User className="h-8 w-8 text-blue-300" />
                <span className="text-white">Käufer</span>
              </Button>
              <Button
                onClick={() => handleRoleSelect('seller')}
                className="h-24 bg-green-600/20 hover:bg-green-600/30 border border-green-400/30 flex flex-col items-center justify-center space-y-2"
                variant="outline"
              >
                <Store className="h-8 w-8 text-green-300" />
                <span className="text-white">Verkäufer</span>
              </Button>
            </div>
            <div className="text-xs text-blue-300 space-y-2">
              <p><strong>Käufer:</strong> Durchsuchen, kommunizieren und bewerten Sie Verkäufer</p>
              <p><strong>Verkäufer:</strong> Bieten Sie Ihre Dienste an (monatliches Abo erforderlich)</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/20 text-white">
        <CardHeader>
          <Button
            onClick={() => setStep('role')}
            variant="ghost"
            size="sm"
            className="w-fit mb-2 text-blue-300 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Zurück
          </Button>
          <CardTitle className="text-xl">
            Registrierung als {selectedRole === 'seller' ? 'Verkäufer' : 'Käufer'}
          </CardTitle>
          <CardDescription className="text-blue-200">
            Erstellen Sie Ihr anonymes Profil
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-white">Benutzername</Label>
            <Input
              id="username"
              type="text"
              placeholder="Ihr anonymer Name"
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white">E-Mail (optional)</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-white">Passwort</Label>
            <Input
              id="password"
              type="password"
              placeholder="Sicheres Passwort"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
          </div>
          <Button
            onClick={handleSignup}
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={!formData.username}
          >
            Konto erstellen
          </Button>
          <p className="text-xs text-blue-300 text-center">
            Durch die Registrierung stimmen Sie unseren Nutzungsbedingungen zu.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
