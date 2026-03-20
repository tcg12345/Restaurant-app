import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const features = [
  { icon: 'search', title: 'Smart Discovery', description: 'AI-powered search with natural language and personalized picks.' },
  { icon: 'grade', title: 'Rate & Review', description: 'Track dining experiences with detailed ratings, photos, and notes.' },
  { icon: 'map', title: 'Interactive Maps', description: 'Visualize restaurants on beautiful maps with real-time data.' },
  { icon: 'bookmark', title: 'Curated Wishlist', description: 'Save restaurants you want to try with smart suggestions.' },
  { icon: 'group', title: 'Social Circle', description: 'Connect with friends, share discoveries, and see their picks.' },
  { icon: 'auto_awesome', title: 'Expert Opinions', description: 'Follow top food critics and culinary tastemakers.' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { signInAsDemo } = useAuth();

  const handleSignIn = () => {
    signInAsDemo();
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-background font-body selection:bg-primary/20">
      {/* Mobile Layout */}
      <div className="lg:hidden min-h-screen flex flex-col">
        {/* Top Bar */}
        <nav className="sticky top-0 z-50 w-full bg-background/90 backdrop-blur-xl pt-safe-area-top border-b border-outline-variant/15">
          <div className="flex h-14 items-center justify-between px-5">
            <span className="text-lg font-headline font-bold text-primary tracking-tight italic">Grubby</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignIn}
              className="text-primary font-body font-bold text-sm"
            >
              Sign In
            </Button>
          </div>
        </nav>

        {/* Hero */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="space-y-6 max-w-sm">
            <div className="inline-flex items-center gap-1.5 bg-primary/8 text-primary px-3 py-1 rounded-full text-xs font-body font-semibold">
              <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              Curated Dining
            </div>
            <h1 className="text-4xl font-headline font-bold text-on-surface leading-tight">
              Discover Your Next <em className="text-primary not-italic">Great Meal</em>
            </h1>
            <p className="text-on-surface-variant text-base leading-relaxed font-body">
              Expert curation, friend recommendations, and AI-powered insights for the culinary explorer.
            </p>
            <div className="space-y-3 pt-4">
              <Button
                className="w-full bg-primary text-primary-foreground rounded-full py-6 font-body font-bold text-base shadow-lg shadow-primary/20"
                onClick={handleSignIn}
              >
                Get Started
              </Button>
              <Button
                variant="outline"
                className="w-full rounded-full py-6 font-body font-bold text-base border-outline-variant text-on-surface-variant"
                onClick={handleSignIn}
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block">
        {/* Desktop Nav */}
        <nav className="fixed top-0 z-50 w-full bg-background/90 backdrop-blur-xl border-b border-outline-variant/15">
          <div className="max-w-screen-xl mx-auto px-6 py-4 flex items-center justify-between">
            <span className="text-xl font-headline font-bold text-primary tracking-tight italic">Grubby</span>
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={handleSignIn} className="font-body font-bold text-on-surface-variant">
                Sign In
              </Button>
              <Button
                className="bg-primary text-primary-foreground rounded-full px-8 font-body font-bold shadow-lg shadow-primary/20"
                onClick={handleSignIn}
              >
                Get Started
              </Button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative pt-32 pb-20 overflow-hidden">
          <div className="max-w-screen-xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <div className="inline-flex items-center gap-1.5 bg-primary/8 text-primary px-3 py-1.5 rounded-full text-xs font-body font-semibold">
                  <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  Curated Restaurant Discovery
                </div>
                <h1 className="text-6xl font-headline font-bold leading-tight text-on-surface">
                  The Art of Dining, <em className="text-primary italic">Editorially Curated</em>
                </h1>
                <p className="text-xl text-on-surface-variant leading-relaxed max-w-lg font-body">
                  Discover exceptional restaurants through expert opinions, friend recommendations, and AI-powered insights.
                </p>
                <div className="flex gap-4">
                  <Button
                    size="lg"
                    className="bg-primary text-primary-foreground rounded-full px-10 py-6 font-body font-bold text-base shadow-lg shadow-primary/20"
                    onClick={handleSignIn}
                  >
                    Start Discovering
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-full px-10 py-6 font-body font-bold text-base border-outline-variant"
                    onClick={handleSignIn}
                  >
                    Try Demo
                  </Button>
                </div>
              </div>

              <div className="relative">
                <div className="bg-primary rounded-2xl p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-10">
                    <span className="material-symbols-outlined text-[120px] text-white">format_quote</span>
                  </div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center">
                      <span className="material-symbols-outlined text-white/80">person</span>
                    </div>
                    <div>
                      <p className="font-headline font-bold text-white">Expert Pick</p>
                      <p className="text-xs text-white/60 font-body">Curated by our editors</p>
                    </div>
                  </div>
                  <blockquote className="text-lg font-headline italic leading-relaxed text-white mb-6">
                    "The way they handle seasonal ingredients is nothing short of poetic. A masterclass in restraint."
                  </blockquote>
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-2 text-white/50 font-body">Must-Try Dishes</p>
                    <ul className="text-sm space-y-1 text-white/80 font-body">
                      <li>&bull; Truffle Risotto</li>
                      <li>&bull; Heirloom Tomato Salad</li>
                      <li>&bull; Dark Chocolate Souffl&eacute;</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-surface-container-low">
          <div className="max-w-screen-xl mx-auto px-6">
            <div className="text-center mb-16">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2 block font-body">Features</span>
              <h2 className="text-4xl font-headline font-bold text-on-surface mb-4">Everything for the Culinary Explorer</h2>
              <p className="text-on-surface-variant text-lg max-w-2xl mx-auto font-body">
                From AI-powered search to social sharing, discover the complete editorial dining experience.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <div key={index} className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 p-6 hover:shadow-premium-xl transition-all duration-300 group cursor-pointer">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary transition-colors">
                    <span className="material-symbols-outlined text-primary text-2xl group-hover:text-white transition-colors">{feature.icon}</span>
                  </div>
                  <h3 className="font-headline font-bold text-on-surface mb-2 group-hover:text-primary transition-colors">{feature.title}</h3>
                  <p className="text-on-surface-variant font-body text-sm leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-primary relative overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <span className="material-symbols-outlined text-[300px] text-white absolute -right-20 -top-20">restaurant</span>
          </div>
          <div className="max-w-screen-xl mx-auto px-6 text-center relative z-10">
            <h2 className="text-4xl font-headline font-bold text-white mb-4">
              Ready to Transform Your Dining Experience?
            </h2>
            <p className="text-white/70 text-xl mb-8 max-w-2xl mx-auto font-body">
              Join Grubby and discover restaurants through expert curation and AI-powered insights.
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-primary rounded-full px-10 py-6 font-body font-bold text-base shadow-lg"
                onClick={handleSignIn}
              >
                Get Started Free
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-10 py-6 font-body font-bold text-base border-white/30 text-white hover:bg-white/10"
                onClick={handleSignIn}
              >
                Try Demo
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
