"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/apiClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      const token = localStorage.getItem("intrst_token");
      if (!token) {
        router.push("/signin");
        return;
      }
      try {
        const data = await apiFetch("/auth/me");
        if (data && data.profile && data.profile.is_admin) {
          setIsAdmin(true);
          fetchPendingUsers();
        } else {
          router.push("/discover");
        }
      } catch (err) {
        router.push("/signin");
      }
    };

    checkAdmin();
  }, [router]);

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const users = await apiFetch("/admin/pending-users");
      setPendingUsers(users);
    } catch (err) {
      console.error("Failed to fetch pending users:", err);
    } finally {
      setLoading(false);
    }
  };

  const approveUser = async (userId: string) => {
    try {
      await apiFetch(`/admin/approve-user/${userId}`, { method: "POST" });
      setPendingUsers(pendingUsers.filter((u) => u.user_id !== userId));
    } catch (err) {
      console.error("Failed to approve user:", err);
    }
  };

  const rejectUser = async (userId: string) => {
    try {
      await apiFetch(`/admin/reject-user/${userId}`, { 
        method: "POST",
        body: JSON.stringify({ reason: "Admin rejected signup." })
      });
      setPendingUsers(pendingUsers.filter((u) => u.user_id !== userId));
    } catch (err) {
      console.error("Failed to reject user:", err);
    }
  };

  if (isAdmin === null) {
    return <div className="min-h-screen flex items-center justify-center">Loading admin...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-dmserif font-bold text-white mb-8">Admin Dashboard</h1>

        <Card className="bg-card/50 backdrop-blur-sm border-border">
          <CardHeader>
            <CardTitle>Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Loading users...</p>
            ) : pendingUsers.length === 0 ? (
              <p className="text-muted-foreground">No pending user approvals at the moment.</p>
            ) : (
              <div className="space-y-4">
                {pendingUsers.map((user) => (
                  <div key={user.user_id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-background/50 border border-border rounded-xl gap-4">
                    <div>
                      <p className="font-semibold text-white">{user.name}</p>
                      <p className="text-sm text-muted-foreground">User ID: {user.user_id}</p>
                      <p className="text-sm text-muted-foreground">Department: {user.department || "N/A"}</p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button onClick={() => approveUser(user.user_id)} className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white">Approve</Button>
                      <Button onClick={() => rejectUser(user.user_id)} className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white" variant="destructive">Reject</Button>
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
