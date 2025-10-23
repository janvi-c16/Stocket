import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Copy, Check, Mail, Star, ExternalLink, Share2, Edit, Twitter, Linkedin, AtSign, Clock, Award, User, Settings } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface UserResponse {
  bio: string;
  email: string;
  firstname: string;
  lastname: string;
  username: string;
  profileImage: string;
  profileBanner: string;
  location: string;
  joinDate?: string;
  status?: "online" | "idle" | "dnd" | "offline";
  pronouns?: string;
  aboutMe?: string;
  customStatus?: string;
  badges?: string[];
  theme?: string;
  connections?: {
    type: string;
    username: string;
    verified?: boolean;
  }[];
}

interface WatchlistResponse {
  success: boolean;
  watchlist: string[];
  message?: string;
}

interface StockItem {
  symbol: string;
  name?: string;
  change?: number;
}

const backendUrl = import.meta.env.VITE_BACKEND_URL ||'http://localhost:5000';

// Status indicator component
const StatusIndicator = ({ status }: { status?: 'online' | 'idle' | 'dnd' | 'offline' }) => {
  const statusColors: Record<string, string> = {
    online: "bg-green-500",
    idle: "bg-yellow-500",
    dnd: "bg-red-500",
    offline: "bg-gray-500"
  };

  const colorClass = status ? statusColors[status] ?? statusColors.offline : statusColors.offline;

  return (
    <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-background ${colorClass}`} />
  );
};

const TradingViewWidget = () => {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-timeline.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      feedMode: "all_symbols",
      isTransparent: true,
      displayMode: "regular",
      width: "100%",
      height: "100%",
      colorTheme: "dark",
      locale: "en",
    });
    document.getElementById("tradingview-widget-container__widget")?.appendChild(script);
  }, []);

  return (
    <div className="tradingview-widget-container h-[336px]">
      <div id="tradingview-widget-container__widget" className="h-full"></div>
    </div>
  );
};

// Stock card component for watchlist items
const StockCard = ({ stock }: { stock: StockItem }) => {
  const isPositive = stock.change && stock.change > 0;
  
  return (
    <div className="flex items-center justify-between p-3 rounded-md bg-card hover:bg-accent transition-colors cursor-pointer">
      <div className="flex items-center gap-2">
        <div className="bg-primary/10 p-2 rounded-md">
          <Star className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="font-medium">{stock.symbol}</p>
          {stock.name && <p className="text-xs text-muted-foreground">{stock.name}</p>}
        </div>
      </div>
      {stock.change !== undefined && (
        <Badge variant={isPositive ? "default" : "destructive"} className="ml-auto">
          {isPositive ? "+" : ""}{stock.change.toFixed(2)}%
        </Badge>
      )}
    </div>
  );
};

const SOCIAL_TYPES = [
  { type: 'twitter', label: 'Twitter', icon: Twitter },
  { type: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { type: 'github', label: 'GitHub', icon: AtSign },
  { type: 'instagram', label: 'Instagram', icon: AtSign },
];

const ProfileComponent = () => {
  const { username } = useParams();
  const [copied, setCopied] = useState(false);
  const [profileData, setProfileData] = useState<UserResponse | null>(null);
  const [watchlist, setWatchlist] = useState<StockItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileBannerFile, setProfileBannerFile] = useState<File | null>(null);
  const [editConnections, setEditConnections] = useState<any[]>([]);
  const [newConnection, setNewConnection] = useState({ type: 'twitter', username: '' });
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [profileBannerPreview, setProfileBannerPreview] = useState<string | null>(null);
  const [deviceType, setDeviceType] = useState<string>("");

  // Mock data for demonstration
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const mockStockDetails: Record<string, { name: string; change: number }> = {
    "AAPL": { name: "Apple Inc.", change: 1.25 },
    "TSLA": { name: "Tesla, Inc.", change: -2.1 },
    "MSFT": { name: "Microsoft Corporation", change: 0.87 },
    "AMZN": { name: "Amazon.com, Inc.", change: 3.46 },
    "NVDA": { name: "NVIDIA Corporation", change: -0.64 }
  };

  useEffect(() => {
    if (username) {
      const fetchProfile = async () => {
        try {
          const response = await axios.get(`${backendUrl}/profile/details/${username}`);
          // Add mock data for demo purposes
          setProfileData({
            ...response.data.data,
            status: "online",
            joinDate: "May 2023",
            pronouns: "they/them",
            aboutMe: "Stock enthusiast and long-term investor. Focused on tech and renewable energy sectors.",
            customStatus: "Researching new opportunities",
            badges: ["premium", "early-supporter", "verified"],
            theme: "midnight",
            connections: [
              { type: "twitter", username: "stocktrader", verified: true },
              { type: "linkedin", username: "stockprofessional", verified: true }
            ]
          });
        } catch (error) {
          console.error('Failed to fetch profile data:', error);
          setErrorMessages((prev) => [...prev, 'Failed to fetch profile data']);
        }
      };

      fetchProfile();
    }
  }, [username]);

  useEffect(() => {
    const fetchWatchlist = async () => {
      if (!username) {
        setErrorMessages((prev) => [...prev, "Please log in to view the watchlist"]);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${backendUrl}/watchlist/${username}`);
        const data: WatchlistResponse = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to fetch watchlist");
        }

        // Enhance watchlist items with mock data
        const enhancedWatchlist = data.watchlist.map(symbol => ({
          symbol,
          ...(mockStockDetails[symbol] ?? { name: symbol, change: 0 })
        }));

        setWatchlist(enhancedWatchlist);
      } catch (err) {
        setErrorMessages((prev) => [...prev, "Failed to fetch watchlist"]);
        console.error("Error fetching watchlist:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWatchlist();
  }, [mockStockDetails, username]);

  const copyToClipboard = async () => {
    try {
      if (profileData?.username) {
        await navigator.clipboard.writeText(`https://stocket.vercel.app/profile/${profileData.username}`);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  // Open edit modal and populate fields
  const openEdit = () => {
    setEditData({
      bio: profileData?.bio || "",
      location: profileData?.location || "",
      aboutMe: profileData?.aboutMe || "",
    });
    setEditConnections(profileData?.connections || []);
    setProfileImageFile(null);
    setProfileBannerFile(null);
    setProfileImagePreview(profileData?.profileImage || null);
    setProfileBannerPreview(profileData?.profileBanner || null);
    setEditOpen(true);
    setEditError(null);
    setEditSuccess(false);
  };

  // Handle field changes
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  // Handle file changes
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'profileImage' | 'profileBanner') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (type === 'profileImage') {
        setProfileImageFile(file);
        setProfileImagePreview(URL.createObjectURL(file));
      }
      if (type === 'profileBanner') {
        setProfileBannerFile(file);
        setProfileBannerPreview(URL.createObjectURL(file));
      }
    }
  };

  // Add new connection
  const addConnection = () => {
    if (!newConnection.username.trim()) return;
    setEditConnections([...editConnections, { ...newConnection }]);
    setNewConnection({ type: 'twitter', username: '' });
  };

  // Remove connection
  const removeConnection = (idx: number) => {
    setEditConnections(editConnections.filter((_, i) => i !== idx));
  };

  // Save profile changes
  const saveProfile = async () => {
    setEditLoading(true);
    setEditError(null);
    setEditSuccess(false);
    try {
      const formData = new FormData();
      formData.append('bio', editData.bio);
      formData.append('location', editData.location);
      formData.append('aboutMe', editData.aboutMe);
      formData.append('connections', JSON.stringify(editConnections));
      if (profileImageFile) formData.append('profileImage', profileImageFile);
      if (profileBannerFile) formData.append('profileBanner', profileBannerFile);
      const response = await axios.put(`${backendUrl}/profile/update/${username}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (response.data.success) {
        setEditSuccess(true);
        setEditOpen(false);
        toast.success('Profile updated successfully!');
        window.location.reload();
      } else {
        setEditError(response.data.message || 'Failed to update profile');
      }
    } catch (err: any) {
      setEditError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setEditLoading(false);
    }
  };

  useEffect(() => {
    const checkDevice = () => {
      setDeviceType(window.innerWidth < 768 ? "Mobile" : "Desktop");
    };
    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  return (
    <div className="bg-background min-h-screen w-full">
      {/* Edit Profile Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto max-w-3xl w-full">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your profile information, upload images, and manage your social links. All changes will be saved to your account.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left column: Text fields */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea id="bio" name="bio" value={editData.bio} onChange={handleEditChange} />
              </div>
              <div>
                <Label htmlFor="aboutMe">About Me</Label>
                <Textarea id="aboutMe" name="aboutMe" value={editData.aboutMe} onChange={handleEditChange} />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input id="location" name="location" value={editData.location} onChange={handleEditChange} />
              </div>
            </div>
            {/* Right column: Images and Socials */}
            <div className="space-y-4">
              <div className="pt-2">
                <h4 className="font-semibold mb-2">Profile Image</h4>
                {profileImagePreview && (
                  <img src={profileImagePreview} alt="Profile Preview" className="h-20 w-20 rounded-full object-cover mb-2" />
                )}
                <Input id="profileImage" type="file" accept="image/*" onChange={e => handleFileChange(e, 'profileImage')} />
                {profileImageFile && <p className="text-xs mt-1">Selected: {profileImageFile.name}</p>}
              </div>
              <div className="pt-2">
                <h4 className="font-semibold mb-2">Profile Banner</h4>
                {profileBannerPreview && (
                  <img src={profileBannerPreview} alt="Banner Preview" className="h-20 w-full object-cover mb-2 rounded" />
                )}
                <Input id="profileBanner" type="file" accept="image/*" onChange={e => handleFileChange(e, 'profileBanner')} />
                {profileBannerFile && <p className="text-xs mt-1">Selected: {profileBannerFile.name}</p>}
              </div>
              <div className="pt-2">
                <h4 className="font-semibold mb-2">Social Profiles</h4>
                <div className="space-y-2">
                  {editConnections.map((conn, idx) => {
                    const Icon = SOCIAL_TYPES.find(s => s.type === conn.type)?.icon || AtSign;
                    return (
                      <div key={idx} className="flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        <span className="font-medium">{conn.type.charAt(0).toUpperCase() + conn.type.slice(1)}</span>
                        <span className="text-muted-foreground">{conn.username}</span>
                        <Button size="icon" variant="ghost" onClick={() => removeConnection(idx)}><span className="text-red-500">×</span></Button>
                      </div>
                    );
                  })}
                  <div className="flex items-center gap-2 mt-2">
                    <select
                      className="border rounded px-2 py-1 bg-background"
                      value={newConnection.type}
                      onChange={e => setNewConnection({ ...newConnection, type: e.target.value })}
                    >
                      {SOCIAL_TYPES.map(s => (
                        <option key={s.type} value={s.type}>{s.label}</option>
                      ))}
                    </select>
                    <Input
                      placeholder="Username or URL"
                      value={newConnection.username}
                      onChange={e => setNewConnection({ ...newConnection, username: e.target.value })}
                      className="w-40"
                    />
                    <Button size="sm" variant="secondary" onClick={addConnection}>Add</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {editError && <p className="text-red-500 text-sm mt-2">{editError}</p>}
          {editSuccess && <p className="text-green-500 text-sm mt-2">Profile updated!</p>}
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={editLoading}>Cancel</Button>
            <Button onClick={saveProfile} disabled={editLoading} {...(editLoading ? { loading: true } : {})}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="container mx-auto py-6">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] lg:grid-cols-[1fr_380px] gap-8 p-4">
          {/* Left Section - Profile */}
          <div className="space-y-6">
            {/* Profile Card */}
            <Card className="overflow-hidden border border-accent w-full max-w-lg mx-auto md:max-w-none md:w-auto p-4 md:p-6">
              <div className="relative">
                {/* Banner */}
                {profileData?.profileBanner ? (
                  <img
                    src={profileData.profileBanner}
                    alt="Profile Banner"
                    className="h-32 md:h-40 w-full object-cover"
                  />
                ) : (
                  <div className="h-32 md:h-40 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                )}
                {/* Avatar and Share */}
                <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 md:left-6 md:translate-x-0 flex flex-col items-center md:block">
                  <div className="relative">
                    <Avatar className="w-24 h-24 border-4 border-background rounded-full">
                      {profileData?.profileImage ? (
                        <AvatarImage alt="Profile Picture" src={profileData.profileImage} />
                      ) : (
                        <AvatarFallback className="text-xl">
                          {profileData?.firstname?.[0]}
                          {profileData?.lastname?.[0]}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    {profileData?.status && <StatusIndicator status={profileData.status} />}
                  </div>
                </div>
                <div className="absolute top-4 right-4 flex gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="icon" variant="secondary" className="rounded-full bg-background/80 backdrop-blur-sm hover:bg-background">
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Share Profile</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              <div className="pt-20 md:pt-16 px-2 md:px-6 pb-6 space-y-4 md:space-y-5 flex flex-col items-center md:items-start">
                {/* Name, username, badges, and edit button */}
                <div className="flex flex-col items-center md:flex-row md:items-start md:justify-between w-full gap-2 md:gap-0">
                  <div className="flex flex-col items-center md:items-start">
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl md:text-3xl font-bold text-center md:text-left">
                        {profileData
                          ? `${profileData.firstname} ${profileData.lastname}`
                          : <Skeleton className="h-8 w-48" />}
                      </h1>
                      {/* Badges */}
                      {profileData?.badges && profileData.badges.includes("verified") && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <div className="text-blue-400">
                                <Award className="h-5 w-5" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>Verified User</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {profileData?.badges && profileData.badges.includes("premium") && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <div className="text-yellow-400">
                                <Star className="h-5 w-5" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>Premium Member</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm text-muted-foreground">
                        {profileData ? `@${profileData.username}` : <Skeleton className="h-4 w-24" />}
                      </p>
                      {/* Custom status indicator */}
                      {profileData?.customStatus && (
                        <div className="flex items-center text-xs text-muted-foreground bg-accent/40 px-2 py-1 rounded-full">
                          <Clock className="h-3 w-3 mr-1" />
                          {profileData.customStatus}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-md w-full md:w-auto mt-4 md:mt-0" onClick={openEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
                
                {/* Pronouns and Join Date */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                  {profileData?.pronouns && (
                    <div className="flex items-center text-muted-foreground">
                      <User className="h-4 w-4 mr-1" />
                      {profileData.pronouns}
                    </div>
                  )}
                  
                  {profileData?.joinDate && (
                    <div className="flex items-center text-muted-foreground">
                      <Clock className="h-4 w-4 mr-1" />
                      Member since {profileData.joinDate}
                    </div>
                  )}
                </div>

                {/* About Me Section */}
                <div className="bg-accent/30 rounded-lg p-4 border border-accent/30">
                  <h3 className="text-sm font-medium mb-2 text-primary">About Me</h3>
                  <p className="text-sm leading-relaxed">
                    {profileData ? profileData.aboutMe || "No about me provided" : <Skeleton className="h-16 w-full" />}
                  </p>
                </div>
                
                {/* Bio Section */}
                <div className="bg-accent/30 rounded-lg p-4 border border-accent/30 w-full">
                  <h3 className="text-sm font-medium mb-2 text-primary">Bio</h3>
                  <p className="text-sm leading-relaxed">
                    {profileData ? profileData.bio || "No bio provided" : <Skeleton className="h-16 w-full" />}
                  </p>
                </div>

                {/* Social Connections */}
                {profileData?.connections && profileData.connections.length > 0 && (
                  <div className="pt-1">
                    <h3 className="text-sm font-medium mb-2 text-primary">Connections</h3>
                    <div className="flex gap-2 flex-wrap">
                      {profileData.connections.map((connection, idx) => (
                        <Button key={idx} variant="outline" size="sm" className="rounded-full">
                          {connection.type === "twitter" ? (
                            <Twitter className="mr-2 h-4 w-4 text-blue-400" />
                          ) : connection.type === "linkedin" ? (
                            <Linkedin className="mr-2 h-4 w-4 text-blue-600" />
                          ) : (
                            <AtSign className="mr-2 h-4 w-4" />
                          )}
                          {connection.username}
                          {connection.verified && (
                            <div className="ml-1 text-green-500">
                              <Check className="h-3 w-3" />
                            </div>
                          )}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contact Info */}
                <div className="pt-1">
                  <h3 className="text-sm font-medium mb-2 text-primary">Contact</h3>
                  <div className="flex flex-wrap gap-2">
                    {profileData ? (
                      <>
                        <Button variant="outline" size="sm" className="rounded-full">
                          <Mail className="mr-2 h-4 w-4" />
                          {profileData.email}
                        </Button>
                        {profileData.location && (
                          <Button variant="outline" size="sm" className="rounded-full">
                            <MapPin className="mr-2 h-4 w-4" />
                            {profileData.location}
                          </Button>
                        )}
                      </>
                    ) : (
                      <>
                        <Skeleton className="h-9 w-[200px] rounded-full" />
                        <Skeleton className="h-9 w-[100px] rounded-full" />
                      </>
                    )}
                  </div>
                </div>
                
                {/* Account Settings Button */}
                <div className="pt-2">
                  <Button variant="secondary" size="sm" className="w-full">
                    <Settings className="mr-2 h-4 w-4" />
                    Account Settings
                  </Button>
                </div>
              </div>
            </Card>

            {/* Watchlist Section */}
            <Card className="border border-accent">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center">
                  <Star className="mr-2 h-5 w-5 text-yellow-500" />
                  Watchlist
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-14 w-full" />
                    <Skeleton className="h-14 w-full" />
                    <Skeleton className="h-14 w-full" />
                  </div>
                ) : errorMessages.length > 0 ? (
                  <div className="text-center p-6">
                    <p className="text-red-500">{errorMessages[0]}</p>
                  </div>
                ) : watchlist.length === 0 ? (
                  <div className="text-center p-6 border border-dashed border-muted rounded-md">
                    <Star className="h-12 w-12 text-muted-foreground mx-auto mb-2 opacity-30" />
                    <p className="text-muted-foreground">No stocks in watchlist yet</p>
                    <Button variant="outline" size="sm" className="mt-4">
                      Add Stocks
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {watchlist.map((stock, index) => (
                      <StockCard key={index} stock={stock} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Section */}
          <div className="space-y-6">
            {/* Share Profile Card */}
            <Card className="border border-accent">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-md">Profile URL</CardTitle>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" variant="ghost" onClick={copyToClipboard}>
                        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{copied ? "Copied!" : "Copy URL"}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <p className="text-sm text-muted-foreground break-all truncate">
                    {`https://stocket.vercel.app/profile/${profileData?.username}`}
                  </p>
                  <Button size="icon" variant="ghost" className="ml-auto">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* News Feed */}
            <Card className="border border-accent">
              <CardHeader className="pb-2">
                <CardTitle className="text-md">Market News</CardTitle>
              </CardHeader>
              <CardContent>
                <TradingViewWidget />
                <div className="mt-2 text-xs text-muted-foreground text-center">
                  Device: <span className="font-semibold">{deviceType}</span>
                </div>
              </CardContent>
            </Card>
            
            {/* Activity/Analytics Section */}
            <Card className="border border-accent">
              <CardHeader className="pb-2">
                <CardTitle className="text-md">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-5 w-5/6" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <p className="flex-1">Added AAPL to watchlist</p>
                      <span className="text-xs text-muted-foreground">2d ago</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <p className="flex-1">Updated profile information</p>
                      <span className="text-xs text-muted-foreground">4d ago</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                      <p className="flex-1">Joined Stocket community</p>
                      <span className="text-xs text-muted-foreground">1w ago</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileComponent;