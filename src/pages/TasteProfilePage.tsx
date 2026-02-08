import { useNavigate } from 'react-router-dom';
import { TasteProfileQuiz } from '@/components/TasteProfileQuiz';
import { TasteProfile } from '@/utils/recommendationAlgorithm';
import { toast } from 'sonner';

export default function TasteProfilePage() {
  const navigate = useNavigate();

  const handleComplete = (profile: TasteProfile) => {
    try {
      localStorage.setItem('taste_profile', JSON.stringify(profile));
      toast.success('Taste profile saved! Your recommendations will now be personalized.');
      navigate('/home');
    } catch (err) {
      console.error('Error saving taste profile:', err);
      toast.error('Failed to save taste profile');
    }
  };

  const handleSkip = () => {
    navigate('/home');
  };

  return (
    <TasteProfileQuiz onComplete={handleComplete} onSkip={handleSkip} />
  );
}
