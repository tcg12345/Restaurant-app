import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				'sans': ['Manrope', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
				'headline': ['Noto Serif', 'Georgia', 'serif'],
				'body': ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
				'label': ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
				'display': ['Noto Serif', 'Georgia', 'serif'],
				'serif': ['Noto Serif', 'Georgia', 'serif'],
			},
			fontSize: {
				'xs': ['0.75rem', { lineHeight: '1rem' }],
				'sm': ['0.875rem', { lineHeight: '1.25rem' }],
				'base': ['1rem', { lineHeight: '1.5rem' }],
				'lg': ['1.125rem', { lineHeight: '1.75rem' }],
				'xl': ['1.25rem', { lineHeight: '1.75rem' }],
				'2xl': ['1.5rem', { lineHeight: '2rem' }],
				'3xl': ['1.875rem', { lineHeight: '2.25rem' }],
				'4xl': ['2.25rem', { lineHeight: '2.5rem' }],
				'5xl': ['3rem', { lineHeight: '1' }],
			},
			colors: {
				/* Stitch editorial palette mapped to shadcn structure */
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					glow: 'hsl(var(--primary-glow))',
					muted: 'hsl(var(--primary-muted))',
					container: 'hsl(var(--primary-container))',
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
					container: 'hsl(var(--secondary-container))',
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
					muted: 'hsl(var(--accent-muted))',
					glow: 'hsl(var(--accent-glow))'
				},
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))'
				},
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					foreground: 'hsl(var(--warning-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				culinary: {
					DEFAULT: 'hsl(var(--culinary))',
					foreground: 'hsl(var(--culinary-foreground))',
					muted: 'hsl(var(--culinary-muted))',
					accent: 'hsl(var(--culinary-accent))',
					highlight: 'hsl(var(--culinary-highlight))'
				},
				rating: {
					empty: 'hsl(var(--rating-empty))',
					filled: 'hsl(var(--rating-filled))',
					hover: 'hsl(var(--rating-hover))'
				},
				glass: {
					DEFAULT: 'hsl(var(--glass))',
					border: 'hsl(var(--glass-border))',
					highlight: 'hsl(var(--glass-highlight))'
				},
				/* Gourmet Canvas semantic colors */
				'surface': {
					DEFAULT: '#fff8f6',
					container: '#f4ecea',
					'container-low': '#faf2f0',
					'container-high': '#eee7e4',
					'container-highest': '#e8e1df',
					'container-lowest': '#ffffff',
					dim: '#e8e1df',
					variant: '#eee7e4',
				},
				'on-surface': '#1e1b1a',
				'on-surface-variant': '#58413c',
				'on-primary-container': '#fff1ee',
				'on-secondary-container': '#62674a',
				'outline': {
					DEFAULT: '#8c716a',
					variant: '#dfbfb8',
				},
				'tertiary': {
					DEFAULT: '#5c564c',
					container: '#e0d9d0',
				},
				'secondary-container': '#e1e6c1',
			},
		backgroundImage: {
				'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
				'gradient-premium': 'var(--gradient-primary)',
				'gradient-accent': 'var(--gradient-accent)',
				'gradient-subtle': 'var(--gradient-subtle)',
				'gradient-hero': 'var(--gradient-hero)',
				'editorial-gradient': 'linear-gradient(180deg, rgba(159, 48, 18, 0) 0%, rgba(30, 27, 26, 0.8) 100%)',
			},
			boxShadow: {
				'premium': '0 20px 40px -15px rgba(30, 27, 26, 0.08)',
				'premium-glow': '0 0 30px 10px rgba(159, 48, 18, 0.1)',
				'premium-xl': '0 20px 40px -12px rgba(30, 27, 26, 0.15)',
				'premium-2xl': '0 -8px 32px rgba(30, 27, 26, 0.1)',
				'bottom-sheet': '0 -8px 32px rgba(30, 27, 26, 0.1)',
				'nav': '0 -4px 24px rgba(30,27,26,0.04)',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
				'xl': '0.75rem',
				'2xl': '1rem',
				'3xl': '1.5rem',
			},
			zIndex: {
				'modal': '9999',
				'modal-overlay': '9998'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'fade-in-up': {
					'0%': { opacity: '0', transform: 'translateY(20px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'scale-in-premium': {
					'0%': { opacity: '0', transform: 'scale(0.95)' },
					'100%': { opacity: '1', transform: 'scale(1)' }
				},
				'slide-in-left': {
					'0%': { opacity: '0', transform: 'translateX(-20px)' },
					'100%': { opacity: '1', transform: 'translateX(0)' }
				},
				'glow-pulse': {
					'0%, 100%': { boxShadow: '0 0 0 0 rgba(159, 48, 18, 0.3)' },
					'50%': { boxShadow: '0 0 30px 10px rgba(159, 48, 18, 0.1)' }
				},
				'shimmer': {
					'0%': { backgroundPosition: '-200% 0' },
					'100%': { backgroundPosition: '200% 0' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in-up': 'fade-in-up 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards',
				'scale-in-premium': 'scale-in-premium 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards',
				'slide-in-left': 'slide-in-left 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards',
				'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
				'shimmer': 'shimmer 2s infinite'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
