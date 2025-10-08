import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, TrendingUp, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-bitcoin-vaults.jpg";

export const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage} 
          alt="Bitcoin DeFi Vaults" 
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background"></div>
      </div>

      {/* Content */}
      <div className="container relative z-10 px-4 mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-sm">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Secured by Starknet</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-4 duration-1000">
          Bitcoin Yield Vaults
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-150">
          Earn sustainable yield on your Bitcoin through automated DeFi strategies on Starknet. 
          Secure, transparent, and built on ERC-4626 standards.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
          <Button 
            asChild
            size="lg" 
            className="group px-8 py-6 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_40px_rgba(247,147,26,0.3)] hover:shadow-[0_0_60px_rgba(247,147,26,0.5)] transition-all duration-300"
          >
            <Link to="/vaults">
              Start Earning
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          
          <Button 
            asChild
            size="lg" 
            variant="outline"
            className="px-8 py-6 text-lg font-semibold border-primary/30 hover:border-primary hover:bg-primary/10"
          >
            <Link to="/analytics">
              View Analytics
            </Link>
          </Button>
        </div>

        {/* Feature Pills */}
        <div className="flex flex-wrap gap-6 justify-center mt-12 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="w-5 h-5 text-accent" />
            <span>Up to 12% APY</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Lock className="w-5 h-5 text-secondary" />
            <span>ERC-4626 Standard</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Shield className="w-5 h-5 text-primary" />
            <span>Audited Contracts</span>
          </div>
        </div>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10"></div>
    </section>
  );
};
