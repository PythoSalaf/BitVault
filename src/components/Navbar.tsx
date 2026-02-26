import { Button } from "@/components/ui/button";
import { Shield, Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { useVaultApp } from "@/context/VaultAppContext";

// Utility to truncate address for display
const truncateAddress = (address: string): string => {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { address, connect, disconnect, isConnecting } = useVaultApp();
  const location = useLocation();

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Vaults", path: "/vaults" },
    { name: "Analytics", path: "/analytics" },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleWalletAction = () => {
    if (address) {
      disconnect();
    } else {
      connect();
    }
  };

  const buttonText = address
    ? truncateAddress(address)
    : "Connect Wallet";
  const buttonVariant = address ? "outline" : "default";

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              BitVault
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm font-medium transition-colors relative group ${
                  isActive(item.path)
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.name}
                <span
                  className={`absolute -bottom-1 left-0 h-0.5 bg-primary transition-all ${
                    isActive(item.path) ? "w-full" : "w-0 group-hover:w-full"
                  }`}
                />
              </Link>
            ))}
          </div>

          {/* CTA Button */}
          <div className="hidden md:block">
            <Button
              onClick={handleWalletAction}
              disabled={isConnecting}
              variant={buttonVariant}
              className={`${
                address
                  ? "text-primary border-primary hover:bg-primary/5"
                  : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(247,147,26,0.3)] hover:shadow-[0_0_30px_rgba(247,147,26,0.5)] transition-all"
              }`}
            >
              {isConnecting ? "Connecting..." : buttonText}
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? "bg-primary/10 text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {item.name}
              </Link>
            ))}
            <div className="px-4 pt-2">
              <Button
                onClick={handleWalletAction}
                disabled={isConnecting}
                variant={buttonVariant}
                className={`w-full ${
                  address
                    ? "text-primary border-primary hover:bg-primary/5"
                    : "bg-primary hover:bg-primary/90 text-primary-foreground"
                }`}
              >
                {isConnecting ? "Connecting..." : buttonText}
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
