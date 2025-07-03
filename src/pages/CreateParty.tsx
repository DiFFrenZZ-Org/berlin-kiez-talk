import { useNavigate } from 'react-router-dom';
import { CreatePartyForm, PartyFormValues } from '@/components/events/CreatePartyForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const CreatePartyPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = (values: PartyFormValues) => {
    console.log('party data', values);
    toast({ title: 'Party created!', description: 'Your party has been saved.' });
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-4">
      <div className="max-w-2xl mx-auto">
        <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
          <CardHeader>
            <CardTitle>Let&apos;s plan your party!</CardTitle>
          </CardHeader>
          <CardContent>
            <CreatePartyForm onSubmit={handleSubmit} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreatePartyPage;
