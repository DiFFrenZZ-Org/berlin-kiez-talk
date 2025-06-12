
import { useState } from "react";
import { User, Store, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const berlinBoroughs = [
  'Mitte', 'Friedrichshain-Kreuzberg', 'Pankow', 'Charlottenburg-Wilmersdorf',
  'Spandau', 'Steglitz-Zehlendorf', 'Tempelhof-Schöneberg', 'Neukölln', 
  'Treptow-Köpenick', 'Marzahn-Hellersdorf', 'Lichtenberg', 'Reinickendorf'
];

export const AuthFlow = () => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [step, setStep] = useState<'role' | 'form'>('form');
  const [selectedRole, setSelectedRole] = useState<'seller' | 'buyer'>('buyer');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nickname: '',
    borough: '__placeholder',
  });

  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const handleRoleSelect = (role: 'seller' | 'buyer') => {
    setSelectedRole(role);
    setStep('form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signin') {
        const { error } = await signIn(formData.email, formData.password);
        if (error) throw error;
        toast({
          title: "Willkommen zurück!",
          description: "Sie sind erfolgreich angemeldet.",
        });
      } else {
        const { error } = await signUp(formData.email, formData.password, {
          nickname: formData.nickname,
          user_role: selectedRole,
          borough: formData.borough
        });
        if (error) throw error;
        toast({
          title: "Konto erstellt!",
          description: "Bitte bestätigen Sie Ihre E-Mail-Adresse.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'signup' && step === 'role') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg bg-white/10 backdrop-blur-md border-white/20 text-white">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Willkommen bei KiezTalk</CardTitle>
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
          {mode === 'signup' && step === 'form' && (
            <Button
              onClick={() => setStep('role')}
              variant="ghost"
              size="sm"
              className="w-fit mb-2 text-blue-300 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Zurück
            </Button>
          )}
          <CardTitle className="text-xl">
            {mode === 'signin' 
              ? 'Anmelden' 
              : `Registrierung als ${selectedRole === 'seller' ? 'Verkäufer' : 'Käufer'}`
            }
          </CardTitle>
          <CardDescription className="text-blue-200">
            {mode === 'signin' 
              ? 'Melden Sie sich in Ihrem Konto an'
              : 'Erstellen Sie Ihr anonymes Profil'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">E-Mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                required
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
                required
              />
            </div>

            {mode === 'signup' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="nickname" className="text-white">Nickname</Label>
                  <Input
                    id="nickname"
                    type="text"
                    placeholder="Ihr anonymer Name"
                    value={formData.nickname}
                    onChange={(e) => setFormData(prev => ({ ...prev, nickname: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="borough" className="text-white">Bezirk</Label>
                  <Select 
                    value={formData.borough} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, borough: value }))}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Wählen Sie Ihren Bezirk" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__placeholder" disabled>
                        Wählen Sie Ihren Bezirk
                      </SelectItem>
                      {berlinBoroughs.map((borough) => (
                        <SelectItem key={borough} value={borough}>
                          {borough}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === 'signin' ? 'Anmelden...' : 'Registrieren...'}
                </>
              ) : (
                mode === 'signin' ? 'Anmelden' : 'Konto erstellen'
              )}
            </Button>
          </form>

          <div className="text-center space-y-2">
            <Button
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setStep(mode === 'signin' ? 'role' : 'form');
              }}
              variant="link"
              className="text-blue-300 hover:text-white"
            >
              {mode === 'signin' 
                ? 'Noch kein Konto? Registrieren' 
                : 'Bereits ein Konto? Anmelden'
              }
            </Button>
          </div>

          <p className="text-xs text-blue-300 text-center">
            Durch die Registrierung stimmen Sie unseren Nutzungsbedingungen zu.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
