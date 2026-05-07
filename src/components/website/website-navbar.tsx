"use client";

import { NavLink } from "react-router";

import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { logout } from "@/store/slices/authSlice";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function WebsiteNavbar() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <NavLink to="/" className="text-xl font-bold">
              Project Setup
            </NavLink>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `text-sm font-medium transition-colors hover:text-primary ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) =>
                `text-sm font-medium transition-colors hover:text-primary ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`
              }
            >
              Dashboard
            </NavLink>
            {!isAuthenticated ? (
              <>
                <NavLink
                  to="/admin/login"
                  className={({ isActive }) =>
                    `text-sm font-medium transition-colors hover:text-primary ${
                      isActive ? "text-primary" : "text-muted-foreground"
                    }`
                  }
                >
                  Admin Login
                </NavLink>
                <NavLink
                  to="/user/login"
                  className={({ isActive }) =>
                    `text-sm font-medium transition-colors hover:text-primary ${
                      isActive ? "text-primary" : "text-muted-foreground"
                    }`
                  }
                >
                  User Login
                </NavLink>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  Hi, {user?.name ?? "Guest"}
                </span>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            )}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-4">

            
            {/* Mobile menu button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col gap-4 mt-8">
                  <NavLink
                    to="/"
                    end
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `text-base font-medium transition-colors hover:text-primary ${
                        isActive ? "text-primary" : "text-muted-foreground"
                      }`
                    }
                  >
                    Home
                  </NavLink>
                  <NavLink
                    to="/admin/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `text-base font-medium transition-colors hover:text-primary ${
                        isActive ? "text-primary" : "text-muted-foreground"
                      }`
                    }
                  >
                    Dashboard
                  </NavLink>
                  {!isAuthenticated ? (
                    <>
                      <NavLink
                        to="/admin/login"
                        onClick={() => setMobileMenuOpen(false)}
                        className={({ isActive }) =>
                          `text-base font-medium transition-colors hover:text-primary ${
                            isActive ? "text-primary" : "text-muted-foreground"
                          }`
                        }
                      >
                        Admin Login
                      </NavLink>
                      <NavLink
                        to="/user/login"
                        onClick={() => setMobileMenuOpen(false)}
                        className={({ isActive }) =>
                          `text-base font-medium transition-colors hover:text-primary ${
                            isActive ? "text-primary" : "text-muted-foreground"
                          }`
                        }
                      >
                        User Login
                      </NavLink>
                    </>
                  ) : (
                    <div className="flex flex-col gap-4 pt-4 border-t">
                      <span className="text-sm text-muted-foreground">
                        Hi, {user?.name ?? "Guest"}
                      </span>
                      <Button variant="outline" onClick={handleLogout}>
                        Logout
                      </Button>
                    </div>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

