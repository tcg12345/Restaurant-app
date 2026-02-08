import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft, Utensils, Flame, DollarSign, Compass, Heart, Clock, Sparkles } from 'lucide-react';
import { TasteProfile } from '@/utils/recommendationAlgorithm';
import { cn } from '@/lib/utils';

interface TasteProfileQuizProps {
  onComplete: (profile: TasteProfile) => void;
  onSkip?: () => void;
}

interface QuizQuestion {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  type: 'single' | 'multi' | 'slider';
  options?: { value: string; label: string; emoji: string; description?: string }[];
  multiMax?: number;
  field: keyof TasteProfile;
}

const QUESTIONS: QuizQuestion[] = [
  {
    id: 'vibe',
    title: "What's your ideal dining vibe?",
    subtitle: 'This helps us match the right atmosphere',
    icon: Sparkles,
    type: 'single',
    field: 'diningVibe',
    options: [
      { value: 'casual', label: 'Casual & Relaxed', emoji: '😌', description: 'Low-key spots, comfort food' },
      { value: 'trendy', label: 'Trendy & Hip', emoji: '✨', description: 'Buzzing hotspots, Instagram-worthy' },
      { value: 'fine_dining', label: 'Fine Dining', emoji: '🥂', description: 'White tablecloth, tasting menus' },
      { value: 'cozy', label: 'Cozy & Intimate', emoji: '🕯️', description: 'Warm, romantic, neighborhood gems' },
      { value: 'lively', label: 'Lively & Social', emoji: '🎉', description: 'Great for groups, fun atmosphere' },
    ],
  },
  {
    id: 'adventure',
    title: 'How adventurous are you with food?',
    subtitle: 'Helps us know when to push your boundaries',
    icon: Compass,
    type: 'single',
    field: 'adventureLevel',
    options: [
      { value: 'comfort', label: 'Comfort Zone', emoji: '🏠', description: 'I know what I like and stick to it' },
      { value: 'sometimes', label: 'Sometimes Adventurous', emoji: '🗺️', description: 'Open to trying new things occasionally' },
      { value: 'always', label: 'Always Exploring', emoji: '🚀', description: "The weirder the better, I'll try anything" },
    ],
  },
  {
    id: 'spice',
    title: "What's your spice tolerance?",
    subtitle: 'So we can gauge heat levels for you',
    icon: Flame,
    type: 'single',
    field: 'spiceTolerance',
    options: [
      { value: 'mild', label: 'Keep it Mild', emoji: '🌶️' },
      { value: 'medium', label: 'Medium Heat', emoji: '🌶️🌶️' },
      { value: 'spicy', label: 'Bring the Heat', emoji: '🌶️🌶️🌶️' },
      { value: 'extra_spicy', label: 'Maximum Spice', emoji: '🔥🔥🔥' },
    ],
  },
  {
    id: 'price',
    title: "What's your ideal price range?",
    subtitle: 'Your typical dining budget per person',
    icon: DollarSign,
    type: 'single',
    field: 'pricePreference',
    options: [
      { value: '1', label: 'Budget-Friendly', emoji: '$', description: 'Under $15 per person' },
      { value: '2', label: 'Moderate', emoji: '$$', description: '$15-30 per person' },
      { value: '3', label: 'Upscale', emoji: '$$$', description: '$30-60 per person' },
      { value: '4', label: 'Fine Dining', emoji: '$$$$', description: '$60+ per person' },
    ],
  },
  {
    id: 'cuisines',
    title: 'Which cuisines excite you most?',
    subtitle: 'Pick up to 5 that you love or want to explore',
    icon: Utensils,
    type: 'multi',
    multiMax: 5,
    field: 'favoriteCuisines',
    options: [
      { value: 'Italian', label: 'Italian', emoji: '🇮🇹' },
      { value: 'Japanese', label: 'Japanese', emoji: '🇯🇵' },
      { value: 'Mexican', label: 'Mexican', emoji: '🇲🇽' },
      { value: 'Chinese', label: 'Chinese', emoji: '🇨🇳' },
      { value: 'Indian', label: 'Indian', emoji: '🇮🇳' },
      { value: 'Thai', label: 'Thai', emoji: '🇹🇭' },
      { value: 'French', label: 'French', emoji: '🇫🇷' },
      { value: 'Korean', label: 'Korean', emoji: '🇰🇷' },
      { value: 'Mediterranean', label: 'Mediterranean', emoji: '🫒' },
      { value: 'American', label: 'American', emoji: '🇺🇸' },
      { value: 'Vietnamese', label: 'Vietnamese', emoji: '🇻🇳' },
      { value: 'Middle Eastern', label: 'Middle Eastern', emoji: '🧆' },
      { value: 'Spanish', label: 'Spanish', emoji: '🇪🇸' },
      { value: 'Greek', label: 'Greek', emoji: '🇬🇷' },
      { value: 'BBQ', label: 'BBQ', emoji: '🍖' },
      { value: 'Seafood', label: 'Seafood', emoji: '🦞' },
      { value: 'Steakhouse', label: 'Steakhouse', emoji: '🥩' },
      { value: 'Sushi', label: 'Sushi', emoji: '🍣' },
    ],
  },
  {
    id: 'priorities',
    title: 'What matters most to you?',
    subtitle: 'Pick your top 2 priorities when choosing a restaurant',
    icon: Heart,
    type: 'multi',
    multiMax: 2,
    field: 'priorities',
    options: [
      { value: 'food_quality', label: 'Food Quality', emoji: '👨‍🍳', description: 'Exceptional taste and preparation' },
      { value: 'atmosphere', label: 'Atmosphere', emoji: '🎨', description: 'Ambiance and design matter' },
      { value: 'service', label: 'Service', emoji: '🤝', description: 'Attentive and friendly staff' },
      { value: 'value', label: 'Value for Money', emoji: '💰', description: 'Great food at fair prices' },
      { value: 'location', label: 'Convenient Location', emoji: '📍', description: 'Close by and easy to get to' },
    ],
  },
  {
    id: 'occasion',
    title: 'When do you typically dine out?',
    subtitle: 'Helps us recommend the right type of spot',
    icon: Clock,
    type: 'single',
    field: 'diningOccasion',
    options: [
      { value: 'weekday_lunch', label: 'Weekday Lunch', emoji: '☀️', description: 'Quick and convenient bites' },
      { value: 'weeknight_dinner', label: 'Weeknight Dinner', emoji: '🌙', description: 'Regular evening meals out' },
      { value: 'weekend_brunch', label: 'Weekend Brunch', emoji: '🥞', description: 'Lazy weekend mornings' },
      { value: 'special_occasions', label: 'Special Occasions', emoji: '🎂', description: 'Celebrations and date nights' },
    ],
  },
];

export function TasteProfileQuiz({ onComplete, onSkip }: TasteProfileQuizProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({
    diningVibe: '',
    adventureLevel: '',
    spiceTolerance: '',
    pricePreference: 2,
    favoriteCuisines: [],
    priorities: [],
    dietaryImportance: 'somewhat',
    diningOccasion: '',
  });

  const question = QUESTIONS[currentStep];
  const progress = ((currentStep + 1) / QUESTIONS.length) * 100;

  const handleSingleSelect = (value: string) => {
    const fieldValue = question.field === 'pricePreference' ? parseInt(value) : value;
    setAnswers(prev => ({ ...prev, [question.field]: fieldValue }));
    // Auto-advance after a brief delay for single select
    setTimeout(() => {
      if (currentStep < QUESTIONS.length - 1) {
        setCurrentStep(prev => prev + 1);
      }
    }, 300);
  };

  const handleMultiSelect = (value: string) => {
    setAnswers(prev => {
      const currentValues = prev[question.field] as string[];
      if (currentValues.includes(value)) {
        return { ...prev, [question.field]: currentValues.filter(v => v !== value) };
      }
      if (question.multiMax && currentValues.length >= question.multiMax) {
        return prev;
      }
      return { ...prev, [question.field]: [...currentValues, value] };
    });
  };

  const handleNext = () => {
    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    const profile: TasteProfile = {
      diningVibe: answers.diningVibe || 'casual',
      adventureLevel: answers.adventureLevel || 'sometimes',
      spiceTolerance: answers.spiceTolerance || 'medium',
      pricePreference: answers.pricePreference || 2,
      favoriteCuisines: answers.favoriteCuisines || [],
      priorities: answers.priorities || ['food_quality'],
      dietaryImportance: answers.dietaryImportance || 'somewhat',
      diningOccasion: answers.diningOccasion || 'weeknight_dinner',
    };
    onComplete(profile);
  };

  const isCurrentValid = () => {
    const value = answers[question.field];
    if (question.type === 'multi') {
      return Array.isArray(value) && value.length > 0;
    }
    return value !== '' && value !== undefined;
  };

  const currentValue = answers[question.field];
  const Icon = question.icon;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress Bar */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur pt-safe-area-top">
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground font-medium">
              {currentStep + 1} of {QUESTIONS.length}
            </span>
            {onSkip && (
              <Button variant="ghost" size="sm" onClick={onSkip} className="text-muted-foreground text-sm">
                Skip for now
              </Button>
            )}
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="flex-1 px-4 pt-8 pb-32 animate-fade-in-up" key={currentStep}>
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-1">
            {question.title}
          </h2>
          <p className="text-muted-foreground text-sm mb-8">
            {question.subtitle}
          </p>

          {/* Options */}
          <div className={cn(
            'gap-3',
            question.type === 'multi' && question.options && question.options.length > 10
              ? 'flex flex-wrap'
              : 'flex flex-col'
          )}>
            {question.options?.map((option) => {
              const isSelected = question.type === 'multi'
                ? (currentValue as string[])?.includes(option.value)
                : currentValue === option.value || currentValue === parseInt(option.value);

              if (question.type === 'multi' && question.options && question.options.length > 10) {
                // Chip style for many options (cuisines)
                return (
                  <button
                    key={option.value}
                    onClick={() => handleMultiSelect(option.value)}
                    className={cn(
                      'px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 border',
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm scale-105'
                        : 'bg-background text-foreground border-border hover:border-primary/50 hover:bg-muted/50'
                    )}
                  >
                    <span className="mr-1.5">{option.emoji}</span>
                    {option.label}
                  </button>
                );
              }

              // Card style for fewer options
              return (
                <button
                  key={option.value}
                  onClick={() => question.type === 'single' ? handleSingleSelect(option.value) : handleMultiSelect(option.value)}
                  className={cn(
                    'w-full p-4 rounded-xl text-left transition-all duration-200 border',
                    isSelected
                      ? 'bg-primary/5 border-primary shadow-sm ring-1 ring-primary/20'
                      : 'bg-background border-border hover:border-primary/30 hover:bg-muted/30'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl flex-shrink-0">{option.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className={cn(
                        'font-medium text-sm',
                        isSelected ? 'text-primary' : 'text-foreground'
                      )}>
                        {option.label}
                      </div>
                      {option.description && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {option.description}
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {question.type === 'multi' && (
            <p className="text-xs text-muted-foreground mt-3">
              {(currentValue as string[])?.length || 0} / {question.multiMax} selected
            </p>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border pb-safe-area-bottom">
        <div className="px-4 py-3 flex items-center gap-3 max-w-lg mx-auto">
          {currentStep > 0 && (
            <Button variant="outline" onClick={handleBack} className="flex-shrink-0">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={!isCurrentValid()}
            className="flex-1"
          >
            {currentStep === QUESTIONS.length - 1 ? (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Get My Recommendations
              </>
            ) : (
              <>
                Continue
                <ChevronRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
