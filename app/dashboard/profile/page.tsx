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
import { Upload, Calendar, Trophy, Ticket, Edit2, Save, X } from "lucide-react";
import { format } from "date-fns";

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

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">Failed to load profile</div>
      </div>
    );
  }

  const profileImageUrl = profile.profileImage || getRandomProfileImage();

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} className="flex items-center gap-2">
            <Edit2 className="h-4 w-4" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
            <Button variant="outline" onClick={handleCancel} className="flex items-center gap-2">
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Your account details and basic information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Profile Image */}
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="w-24 h-24">
                <AvatarImage src={isEditing ? editForm.profileImage : profileImageUrl} alt="Profile" />
                <AvatarFallback>{profile.name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              {isEditing && (
                <div className="text-center">
                  <Label htmlFor="image-upload" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                      <Upload className="h-4 w-4" />
                      Upload Photo
                    </div>
                  </Label>
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <p className="text-xs text-gray-500 mt-1">Max 5MB</p>
                </div>
              )}
            </div>

            {/* Profile Details */}
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <p className="text-lg font-medium">{profile.name}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="username">Username</Label>
                  {isEditing ? (
                    <Input
                      id="username"
                      value={editForm.username}
                      onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="Enter your username"
                    />
                  ) : (
                    <p className="text-lg font-medium">@{profile.username}</p>
                  )}
                </div>

                <div>
                  <Label>Email</Label>
                  <p className="text-lg">{profile.email}</p>
                </div>

                <div>
                  <Label>Member Since</Label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <p className="text-lg">{format(new Date(profile.createdAt), "MMMM d, yyyy")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lottery Participation History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Lottery Participation History
          </CardTitle>
          <CardDescription>Your participation history and results</CardDescription>
        </CardHeader>
        <CardContent>
          {profile.drawParticipations.length === 0 ? (
            <div className="text-center py-8">
              <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Lottery Participation Yet</h3>
              <p className="text-gray-500">You haven&apos;t participated in any lottery draws yet. Start earning tickets to join the next draw!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {profile.drawParticipations.map((participation) => (
                <div key={participation.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">
                        Draw on {format(new Date(participation.draw.drawDate), "MMMM d, yyyy")}
                      </h4>
                      <Badge variant={participation.isWinner ? "default" : "secondary"}>
                        {participation.isWinner ? "Winner!" : "Participated"}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Tickets Used: {participation.ticketsUsed}</p>
                      <p>Prize Amount: ${participation.draw.prizeAmount}</p>
                      <p>Participated: {format(new Date(participation.participatedAt), "MMM d, yyyy 'at' h:mm a")}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {participation.isWinner ? (
                      <div className="text-green-600 font-semibold">
                        <Trophy className="h-5 w-5 inline mr-1" />
                        Won ${participation.draw.prizeAmount}
                      </div>
                    ) : (
                      <div className="text-gray-500">
                        No win
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 