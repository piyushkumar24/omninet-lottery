"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "react-hot-toast";
import { Upload, Calendar, Trophy, Ticket, Edit2, Save, X, AlertTriangle, User } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { getUserAppliedTickets } from "@/lib/ticket-utils";
import { isR2Url } from "@/lib/r2";
import { R2Image } from "@/components/ui/r2-image";

interface DrawParticipation {
  id: string;
  draw: {
    id: string;
    drawDate: string;
    prizeAmount: number;
    status: string;
  };
  ticketsUsed: number;
  isWinner: boolean;
  participatedAt: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  username: string;
  profileImage?: string;
  createdAt: string;
  drawParticipations: DrawParticipation[];
}

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [appliedTickets, setAppliedTickets] = useState(0);
  const [editForm, setEditForm] = useState({
    name: "",
    username: "",
    profileImage: ""
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Random profile images for default
  const defaultImages = [
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face"
  ];

  const getRandomProfileImage = () => {
    return defaultImages[Math.floor(Math.random() * defaultImages.length)];
  };

  const generateUsername = (name: string) => {
    const cleanName = name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${cleanName}-${randomSuffix}`;
  };

  useEffect(() => {
    fetchProfile();
    fetchTicketCount();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile");
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setEditForm({
          name: data.name || "",
          username: data.username || "",
          profileImage: data.profileImage || ""
        });
      } else {
        toast.error("Failed to load profile");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Error loading profile");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTicketCount = async () => {
    try {
      const response = await fetch("/api/user/tickets");
      if (response.ok) {
        const data = await response.json();
        setAppliedTickets(data.appliedTickets || 0);
      }
    } catch (error) {
      console.error("Error fetching ticket count:", error);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error("Image size must be less than 5MB");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setEditForm(prev => ({
          ...prev,
          profileImage: e.target?.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let imageUrl = editForm.profileImage;

      // Upload image if there's a new file
      if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);
        
        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          imageUrl = uploadData.url;
        } else {
          toast.error("Failed to upload image");
          return;
        }
      }

      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editForm.name,
          username: editForm.username,
          profileImage: imageUrl,
        }),
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
        setIsEditing(false);
        setImageFile(null);
        toast.success("Profile updated successfully!");
        
        // Update session if name changed
        if (editForm.name !== profile?.name) {
          await update({
            name: editForm.name,
          });
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Error updating profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditForm({
      name: profile?.name || "",
      username: profile?.username || "",
      profileImage: profile?.profileImage || ""
    });
    setImageFile(null);
    setIsEditing(false);
  };

  const getProfileImageUrl = (url: string | null | undefined) => {
    if (!url) return getRandomProfileImage();
    
    // Handle Cloudflare R2 URLs directly
    if (isR2Url(url)) {
      return url;
    }
    
    // Handle local uploads or other URLs
    return url;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-gray-500">Failed to load profile</div>
        </div>
      </div>
    );
  }

  const profileImageUrl = getProfileImageUrl(profile.profileImage);
  const isDefaultImage = !profile.profileImage;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-emerald-400/20 to-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 p-6 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white shadow-lg">
              <User className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-800">My Profile</h1>
              <p className="text-slate-600 mt-1">Manage your account and view your lottery history</p>
            </div>
          </div>
          {!isEditing ? (
            <Button 
              onClick={() => setIsEditing(true)} 
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg w-full sm:w-auto"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button 
                onClick={handleSave} 
                disabled={isSaving} 
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save"}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleCancel}
                className="border-2 border-slate-300 hover:border-slate-400"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-2">
            <Card className="bg-white/80 backdrop-blur-sm border-2 border-white/50 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-gray-100">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <User className="h-5 w-5 text-blue-600" />
                  Profile Information
                </CardTitle>
                <CardDescription>Your account details and basic information</CardDescription>
              </CardHeader>
              <CardContent className="p-6 md:p-8">
                <div className="flex flex-col lg:flex-row gap-8">
                  {/* Profile Image Section */}
                  <div className="flex flex-col items-center space-y-6 lg:min-w-0 lg:flex-shrink-0">
                    <div className="relative">
                      <Avatar className="w-32 h-32 border-4 border-white shadow-xl">
                        {(isEditing ? editForm.profileImage : profileImageUrl) ? (
                          <div className="w-full h-full">
                            <R2Image 
                              src={isEditing ? editForm.profileImage : profileImageUrl} 
                              alt="Profile"
                              width={128}
                              height={128}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        ) : (
                          <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700">
                            {profile.name?.charAt(0) || "U"}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      {isDefaultImage && !isEditing && (
                        <div className="absolute -bottom-2 -right-2 bg-red-500 text-white p-2 rounded-full shadow-lg">
                          <AlertTriangle className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    
                    {/* Upload Section - Always show when editing or when no profile picture */}
                    {(isEditing || isDefaultImage) && (
                      <div className="flex flex-col items-center space-y-4 w-full max-w-xs">
                        {isDefaultImage && !isEditing && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                            <div className="flex items-center justify-center gap-2 text-red-600 text-sm font-medium mb-2">
                              <AlertTriangle className="h-4 w-4" />
                              Update Profile Picture
                            </div>
                            <p className="text-red-600 text-xs leading-relaxed">
                              Please update your profile picture from this default one for a personalized experience.
                            </p>
                          </div>
                        )}
                        
                        {isEditing && (
                          <div className="w-full">
                            <Label htmlFor="image-upload" className="cursor-pointer block">
                              <div className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 transition-all duration-300 w-full">
                                <Upload className="h-4 w-4 text-blue-600" />
                                <span className="text-blue-700 font-medium">Upload Photo</span>
                              </div>
                            </Label>
                            <Input
                              id="image-upload"
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                            <p className="text-xs text-slate-500 mt-2 text-center">Max 5MB • JPG, PNG, GIF</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Profile Details */}
                  <div className="flex-1 space-y-6 min-w-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-medium">Full Name</Label>
                        {isEditing ? (
                          <Input
                            value={editForm.name}
                            onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter your full name"
                            className="bg-white border-2 border-slate-200 focus:border-blue-500 transition-colors"
                          />
                        ) : (
                          <div className="text-lg font-semibold text-slate-800 bg-slate-50 rounded-lg px-3 py-3 break-words">
                            {profile.name}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-slate-700 font-medium">Username</Label>
                        {isEditing ? (
                          <Input
                            value={editForm.username}
                            onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                            placeholder="Enter your username"
                            className="bg-white border-2 border-slate-200 focus:border-blue-500 transition-colors"
                          />
                        ) : (
                          <div className="text-lg font-semibold text-slate-800 bg-slate-50 rounded-lg px-3 py-3 break-words">
                            @{profile.username}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-slate-700 font-medium">Email</Label>
                        <div className="text-lg text-slate-800 bg-slate-50 rounded-lg px-3 py-3 break-words">
                          {profile.email}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-slate-700 font-medium">Member Since</Label>
                        <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-3">
                          <Calendar className="h-4 w-4 text-slate-500 flex-shrink-0" />
                          <div className="text-lg text-slate-800 break-words">
                            {formatDate(new Date(profile.createdAt), 'dateOnly')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stats Card */}
          <div className="lg:col-span-1">
            <Card className="bg-white/80 backdrop-blur-sm border-2 border-white/50 shadow-xl h-full">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                <CardTitle className="text-blue-800">Your Stats</CardTitle>
                <CardDescription className="text-blue-600">
                  Your lottery participation overview
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Account Age */}
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Account Age</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatDate(new Date(profile.createdAt), 'relative')}
                    </p>
                  </div>
                </div>

                {/* Applied Tickets */}
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-100 rounded-lg">
                    <Ticket className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Applied Tickets</p>
                    <p className="text-lg font-semibold text-gray-900">{appliedTickets}</p>
                  </div>
                </div>

                {/* Lottery Participations */}
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Trophy className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Lottery Entries</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {profile.drawParticipations.length}
                    </p>
                  </div>
                </div>

                {/* Wins */}
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-100 rounded-lg">
                    <Trophy className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Wins</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {profile.drawParticipations.filter(p => p.isWinner).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Lottery Participation History */}
        <Card className="bg-white/90 backdrop-blur-sm border-2 border-white/50 shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-yellow-50 to-amber-50 border-b border-yellow-200">
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <Trophy className="h-5 w-5" />
              Lottery Participation History
            </CardTitle>
            <CardDescription className="text-yellow-700">
              Your participation history and results
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {profile.drawParticipations.length === 0 ? (
              <div className="text-center py-12">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Ticket className="h-8 w-8 text-yellow-600" />
                  </div>
                </div>
                <h3 className="text-lg font-medium text-slate-800 mb-2">No Lottery Participation Yet</h3>
                <p className="text-slate-600">
                  You haven&apos;t participated in any lottery draws yet. Start earning tickets to join the next draw!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {profile.drawParticipations.map((participation) => (
                  <div 
                    key={participation.id} 
                    className="group p-6 bg-gradient-to-r from-white to-yellow-50 border border-yellow-200 rounded-xl hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="p-3 bg-yellow-100 rounded-xl group-hover:bg-yellow-200 transition-colors flex-shrink-0">
                          <Trophy className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-slate-800 text-lg break-words">
                            Draw on {formatDate(new Date(participation.draw.drawDate), 'dateOnly')}
                          </h4>
                          <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-slate-600">
                            <span>Tickets Used: <span className="font-semibold">{participation.ticketsUsed}</span></span>
                            <span>Prize: <span className="font-semibold text-green-600">${participation.draw.prizeAmount}</span></span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            Participated on {formatDate(new Date(participation.participatedAt), 'full')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-center sm:text-right flex-shrink-0">
                        <Badge 
                          variant={participation.isWinner ? "default" : "secondary"}
                          className={`text-sm px-3 py-1 ${
                            participation.isWinner 
                              ? "bg-green-100 text-green-800 border-green-300" 
                              : "bg-slate-100 text-slate-700 border-slate-300"
                          }`}
                        >
                          {participation.isWinner ? "🎉 Winner!" : "Not selected"}
                        </Badge>
                        
                        {participation.isWinner && (
                          <div className="text-green-600 font-semibold mt-1 text-sm">
                            <Trophy className="h-4 w-4 inline mr-1" />
                            Won ${participation.draw.prizeAmount}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 