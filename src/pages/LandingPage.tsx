import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { GrubbyLogo } from '@/components/GrubbyLogo';

const features = [
  { icon: 'search', title: 'Smart Discovery', description: 'AI-powered search with natural language queries and personalized picks.' },
  { icon: 'grade', title: 'Rate & Review', description: 'Track dining experiences with detailed ratings, photos, and notes.' },
  { icon: 'map', title: 'Interactive Maps', description: 'Visualize restaurants on beautiful maps with real-time data.' },
  { icon: 'favorite', title: 'Curated Wishlist', description: 'Save restaurants you want to try with smart suggestions.' },
  { icon: 'group', title: 'Social Circle', description: 'Connect with friends, share discoveries, and see their picks.' },
  { icon: 'verified', title: 'Expert Opinions', description: 'Follow top food critics and culinary experts.' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background font-body selection:bg-secondary/30">
      {/* Mobile Layout */}
      <div className="lg:hidden min-h-screen flex flex-col">
        {/* Top Bar */}
        <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl pt-safe-area-top">
          <div className="flex h-14 items-center justify-between px-6">
            <GrubbyLogo size="sm" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/auth')}
              className="text-secondary font-headline font-bold text-sm"
            >
              Sign In
            </Button>
          </div>
        </nav>

        {/* Hero */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="space-y-6 max-w-sm">
            <h1 className="text-4xl font-headline font-bold text-primary leading-tight">
              Discover Your Next Great Meal
            </h1>
            <p className="text-on-surface-variant text-base leading-relaxed">
              Curated restaurant discovery with expert opinions and social recommendations.
            </p>
            <div className="space-y-3 pt-4">
              <Button
                className="w-full bg-secondary text-secondary-foreground rounded-full py-6 font-headline font-bold text-base shadow-lg shadow-secondary/20"
                onClick={() => navigate('/auth')}
              >
                Get Started
              </Button>
              <Button
                variant="outline"
                className="w-full rounded-full py-6 font-headline font-bold text-base"
                onClick={() => navigate('/auth')}
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
        <nav className="fixed top-0 z-50 w-full bg-background/80 backdrop-blur-xl">
          <div className="max-w-screen-xl mx-auto px-6 py-4 flex items-center justify-between">
            <GrubbyLogo size="lg" />
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/auth')} className="font-headline font-bold">
                Sign In
              </Button>
              <Button
                className="bg-secondary text-secondary-foreground rounded-full px-8 font-headline font-bold shadow-lg shadow-secondary/20"
                onClick={() => navigate('/auth')}
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
                <Badge className="bg-secondary/10 text-secondary border-0">
                  <span className="material-symbols-outlined text-xs mr-1" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  Curated Restaurant Discovery
                </Badge>
                <h1 className="text-6xl font-headline font-bold leading-tight text-primary">
                  The Art of Dining, Editorially Curated
                </h1>
                <p className="text-xl text-on-surface-variant leading-relaxed max-w-lg">
                  Discover exceptional restaurants through expert opinions, friend recommendations, and AI-powered insights.
                </p>
                <div className="flex gap-4">
                  <Button
                    size="lg"
                    className="bg-secondary text-secondary-foreground rounded-full px-10 py-6 font-headline font-bold text-base shadow-lg shadow-secondary/20"
                    onClick={() => navigate('/auth')}
                  >
                    Start Discovering
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-full px-10 py-6 font-headline font-bold text-base"
                    onClick={() => navigate('/demo')}
                  >
                    Try Demo
                  </Button>
                </div>
              </div>

              <div className="relative">
                <div className="bg-primary-container rounded-xl p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-10">
                    <span className="material-symbols-outlined text-[120px] text-white">format_quote</span>
                  </div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
                      <span className="material-symbols-outlined text-secondary-container">person</span>
                    </div>
                    <div>
                      <p className="font-headline font-bold text-white">Expert Pick</p>
                      <p className="text-xs text-on-primary-container">Curated by our editors</p>
                    </div>
                  </div>
                  <blockquote className="text-lg font-headline font-medium leading-relaxed text-white mb-6">
                    "The way they handle seasonal ingredients is nothing short of poetic. A masterclass in restraint."
                  </blockquote>
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-2 text-secondary-container">Must-Try Dishes</p>
                    <ul className="text-sm space-y-1 text-white/90">
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
              <span className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-2 block">Features</span>
              <h2 className="text-4xl font-headline font-bold text-primary mb-4">Everything for the Culinary Explorer</h2>
              <p className="text-on-surface-variant text-lg max-w-2xl mx-auto">
                From AI-powered search to social sharing, discover the complete editorial dining experience.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <Card key={index} className="bg-surface-container-lowest border-outline-variant/10 hover:shadow-premium-xl transition-all duration-300 group cursor-pointer">
                  <CardHeader className="p-6">
                    <div className="w-14 h-14 rounded-xl bg-primary-container flex items-center justify-center mb-4 group-hover:bg-secondary transition-colors">
                      <span className="material-symbols-outlined text-on-primary-container text-2xl group-hover:text-secondary-foreground transition-colors">{feature.icon}</span>
                    </div>
                    <CardTitle className="group-hover:text-secondary transition-colors">{feature.title}</CardTitle>
                    <CardDescription className="text-base leading-relaxed">{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-primary-container relative overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <span className="material-symbols-outlined text-[300px] text-white absolute -right-20 -top-20">restaurant</span>
          </div>
          <div className="max-w-screen-xl mx-auto px-6 text-center relative z-10">
            <h2 className="text-4xl font-headline font-bold text-white mb-4">
              Ready to Transform Your Dining Experience?
            </h2>
            <p className="text-on-primary-container text-xl mb-8 max-w-2xl mx-auto">
              Join The Culinary Editorial and discover restaurants through expert curation and AI-powered insights.
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                size="lg"
                className="bg-secondary text-secondary-foreground rounded-full px-10 py-6 font-headline font-bold text-base shadow-lg shadow-secondary/20"
                onClick={() => navigate('/auth')}
              >
                Get Started Free
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-10 py-6 font-headline font-bold text-base border-white/30 text-white hover:bg-background/10"
                onClick={() => navigate('/demo')}
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
