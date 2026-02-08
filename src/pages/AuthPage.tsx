import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Eye, EyeOff, Mail, Lock, User, Shield, Play } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { GrubbyLogo } from '@/components/GrubbyLogo';
import { useAuth, DEMO_MODE_ENABLED } from '@/contexts/AuthContext';

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signInAsDemo, user } = useAuth();
  const [activeTab, setActiveTab] = useState('signin');
  
  // Simplified form state
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isExpert, setIsExpert] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [useEmail, setUseEmail] = useState(true); // Toggle between email/username signup

  // If already logged in (including demo mode), redirect to intended page
  useEffect(() => {
    if (user) {
      const state = (location.state as any) || {};
      const params = new URLSearchParams(location.search);
      const redirectTo = state.from || params.get('redirectTo') || '/';
      navigate(redirectTo, { replace: true });
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const state = (location.state as any) || {};
        const params = new URLSearchParams(location.search);
        const redirectTo = state.from || params.get('redirectTo') || '/';
        navigate(redirectTo, { replace: true });
      }
    });
  }, [navigate, location, user]);

  const handleDemoSignIn = () => {
    signInAsDemo();
    toast.success('Welcome to Grubby Demo!');
    const state = (location.state as any) || {};
    const params = new URLSearchParams(location.search);
    const redirectTo = state.from || params.get('redirectTo') || '/';
    navigate(redirectTo, { replace: true });
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email && !username) {
      toast.error('Please enter your email or username');
      return;
    }
    
    if (!password) {
      toast.error('Please enter your password');
      return;
    }
    
    try {
      setIsLoading(true);
      
      let { data, error } = await supabase.auth.signInWithPassword({
        email: email || `${username}@grubbyapp.com`,
        password,
      });
      
      // If email sign-in fails and we have a username, try to find the user's email
      if (error && username && !email) {
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('email')
          .eq('username', username)
          .single();

        if (!userError && userData?.email) {
          const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
            email: userData.email,
            password,
          });
          data = retryData;
          error = retryError;
        }
      }
      
      if (error) throw error;
      
      toast.success('Signed in successfully!');
      const state = (location.state as any) || {};
      const params = new URLSearchParams(location.search);
      const redirectTo = state.from || params.get('redirectTo') || '/';
      navigate(redirectTo, { replace: true });
      
    } catch {
      toast.error('Invalid credentials. Please check your email/username and password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password) {
      toast.error('Please enter a password');
      return;
    }
    
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    try {
      setIsLoading(true);
      
      if (useEmail) {
        // Email signup
        if (!email) {
          toast.error('Please enter your email');
          return;
        }
        
        const { data, error } = await supabase.auth.signUp({
          email: email,
          password,
          options: {
            data: {
              username: email.split('@')[0],
              name: email.split('@')[0], // Use email prefix as name
              is_expert: isExpert,
              is_public: false, // Default to private
              phone_number: null,
              address: null
            }
          }
        });
        
        if (error) throw error;
        
        // Create expert role if selected
        if (isExpert && data.user) {
          try {
            await supabase
              .from('user_roles')
              .insert({
                user_id: data.user.id,
                role: 'expert',
                created_at: new Date().toISOString()
              });
          } catch {
            // Continue even if expert role creation fails
          }
        }
        
        toast.success('Account created! Complete your taste profile for better recommendations.');
        navigate('/taste-profile', { replace: true });
        
      } else {
        // Username signup - create account without email
        if (!username) {
          toast.error('Please enter your username');
          return;
        }
        
        // Check if username is already taken
        const { data: existingUser, error: checkError } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', username)
          .single();
        
        if (existingUser) {
          toast.error('Username already taken. Please choose a different username.');
          return;
        }
        
        // Create a unique email for Supabase auth (but user never sees this)
        const uniqueEmail = `${username}${Date.now()}@grubbyapp.com`;
        
        const { data, error } = await supabase.auth.signUp({
          email: uniqueEmail,
          password,
          options: {
            data: {
              username: username,
              name: username, // Use username as name for username accounts
              is_expert: isExpert,
              is_public: false, // Default to private
              phone_number: null,
              address: null
            }
          }
        });
        
        if (error) throw error;
        
        // The database trigger should create the profile automatically
        // Wait a moment for it to complete, then update email if needed
        if (data.user) {
          // Wait for trigger to complete
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Update the profile email for username lookup (only for username accounts)
          if (!useEmail) {
            try {
              await supabase
                .from('profiles')
                .update({ email: uniqueEmail })
                .eq('id', data.user.id);
            } catch {
              // Continue even if email update fails
            }
          }
        }
        
        // Create expert role if selected
        if (isExpert && data.user) {
          try {
            await supabase
              .from('user_roles')
              .insert({
                user_id: data.user.id,
                role: 'expert',
                created_at: new Date().toISOString()
              });
          } catch {
            // Continue even if expert role creation fails
          }
        }
        
        toast.success('Account created! Complete your taste profile for better recommendations.');
        navigate('/taste-profile', { replace: true });
      }
      
    } catch (error: any) {
      console.error('Error signing up:', error);
      
      if (error.message.includes('User already registered')) {
        toast.error('An account already exists with this email/username. Please sign in instead.');
      } else if (error.message.includes('Username') || error.message.includes('username')) {
        toast.error('Username already taken. Please choose a different username.');
      } else if (error.message.includes('Database error')) {
        toast.error('Database error creating account. Please try again.');
      } else {
        toast.error(error.message || 'Error creating account');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <GrubbyLogo className="mx-auto h-12 w-auto" />
          <h1 className="text-2xl font-bold text-foreground mt-4">Welcome to Grubby</h1>
          <p className="text-muted-foreground">Sign in to your account or create a new one</p>
        </div>

        <Card className="bg-card border border-border/30 rounded-2xl shadow-none">
          {/* Demo Mode Sign In Button */}
          {DEMO_MODE_ENABLED && (
            <div className="p-6 pb-0">
              <Button
                onClick={handleDemoSignIn}
                className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 rounded-xl text-white"
              >
                <Play className="h-5 w-5 mr-2" />
                Enter Demo Mode
              </Button>
              <p className="text-center text-sm text-muted-foreground mt-2">
                No account needed - explore the app instantly
              </p>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or sign in with credentials</span>
                </div>
              </div>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="mt-0">
              <form onSubmit={handleSignIn}>
                <CardContent className="space-y-6 pt-8 px-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email" className="text-sm font-medium">Email or Username</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signin-email"
                          type="text"
                          placeholder="Enter your email or username"
                          value={email || username}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value.includes('@')) {
                              setEmail(value);
                              setUsername('');
                            } else {
                              setUsername(value);
                              setEmail('');
                            }
                          }}
                          className="pl-10 h-12 rounded-xl"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signin-password" className="text-sm font-medium">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signin-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 pr-12 h-12 rounded-xl"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="flex flex-col space-y-4 pt-6 px-6">
                  <Button 
                    type="submit" 
                    className="w-full h-12 font-medium bg-primary hover:bg-primary/90 rounded-xl" 
                    disabled={isLoading}
                  >
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="mt-0">
              <form onSubmit={handleSignUp}>
                <CardContent className="space-y-6 pt-8 px-6">
                  {/* Signup Method Toggle */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Button
                        type="button"
                        variant={useEmail ? "default" : "outline"}
                        onClick={() => setUseEmail(true)}
                        className="flex-1"
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Use Email
                      </Button>
                      <Button
                        type="button"
                        variant={!useEmail ? "default" : "outline"}
                        onClick={() => setUseEmail(false)}
                        className="flex-1"
                      >
                        <User className="h-4 w-4 mr-2" />
                        Use Username
                      </Button>
                    </div>
                    
                    {useEmail ? (
                      <div className="space-y-2">
                        <Label htmlFor="signup-email" className="text-sm font-medium">Email Address</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-10 h-12 rounded-xl"
                            required
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label htmlFor="signup-username" className="text-sm font-medium">Username</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signup-username"
                            type="text"
                            placeholder="Choose a username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="pl-10 h-12 rounded-xl"
                            required
                          />
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-sm font-medium">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 pr-12 h-12 rounded-xl"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Password must be at least 6 characters
                      </p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Expert Account Option */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 p-4 bg-muted/50 border-border/50 rounded-xl border">
                      <Checkbox
                        id="signup-expert"
                        checked={isExpert}
                        onCheckedChange={(checked) => setIsExpert(checked as boolean)}
                      />
                      <div className="space-y-1">
                        <Label htmlFor="signup-expert" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                          <Shield className="h-4 w-4 text-amber-600" />
                          Create as Expert Account
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Get verified expert status with special badges and features. Your reviews will be highlighted as expert recommendations.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="flex flex-col space-y-4 pt-6 px-6">
                  <Button 
                    type="submit" 
                    className="w-full h-12 font-medium bg-primary hover:bg-primary/90 rounded-xl" 
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                  
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Already have an account?
                    </p>
                    <Button
                      type="button"
                      variant="link"
                      className="p-0 h-auto text-sm text-primary hover:text-primary-glow"
                      onClick={() => setActiveTab('signin')}
                    >
                      Sign in instead
                    </Button>
                  </div>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}