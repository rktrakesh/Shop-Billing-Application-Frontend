import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, Plus, Trash2, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/index";
import { formatDateTime } from "@/utils";
import axiosInstance from "@/api/axios";
import toast from "react-hot-toast";

interface AllowedIpResponse {
  id: number;
  ipAddress: string;
  label: string;
  addedByUsername: string;
  createdAt: string;
}

export default function IpWhitelistSection() {
  const qc = useQueryClient();
  const [newIp, setNewIp] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [adding, setAdding] = useState(false);

  const { data: ipsRes, isLoading } = useQuery({
    queryKey: ["ip-whitelist"],
    queryFn: () => axiosInstance.get<{ data: AllowedIpResponse[] }>("/api/admin/ip-whitelist"),
  });
  const ips = ipsRes?.data?.data ?? [];

  const { data: myIpRes } = useQuery({
    queryKey: ["my-ip"],
    queryFn: () => axiosInstance.get<{ data: { ipAddress: string } }>("/api/admin/ip-whitelist/my-ip"),
  });
  const myIp = myIpRes?.data?.data?.ipAddress;

  const removeMutation = useMutation({
    mutationFn: (id: number) => axiosInstance.delete(`/api/admin/ip-whitelist/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ip-whitelist"] });
      toast.success("IP removed");
    },
    onError: () => toast.error("Failed to remove IP"),
  });

  const addMutation = useMutation({
    mutationFn: (data: { ipAddress: string; label: string }) => axiosInstance.post("/api/admin/ip-whitelist", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ip-whitelist"] });
      toast.success("IP whitelisted");
      setNewIp("");
      setNewLabel("");
      setAdding(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to add IP"),
  });

  const handleAdd = () => {
    if (!newIp.trim()) {
      toast.error("Enter an IP address");
      return;
    }
    addMutation.mutate({ ipAddress: newIp.trim(), label: newLabel.trim() });
  };

  const handleAddMyIp = () => {
    if (!myIp) return;
    setNewIp(myIp);
    setNewLabel("My Current IP");
    setAdding(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-text-primary">IP Whitelist</h3>
        </div>
        <div className="flex items-center gap-2">
          {myIp && (
            <Button size="sm" variant="outline" onClick={handleAddMyIp}>
              <Wifi className="h-3.5 w-3.5" />
              Add My IP ({myIp})
            </Button>
          )}
          <Button size="sm" onClick={() => setAdding(true)}>
            <Plus className="h-3.5 w-3.5" />
            Add IP
          </Button>
        </div>
      </div>

      <p className="text-xs text-text-muted">Only these IP addresses can log in without OTP verification. Anyone from an unknown IP will trigger an OTP sent to the admin email.</p>

      {/* Add IP form */}
      {adding && (
        <div className="p-3 border border-primary/30 rounded-xl bg-primary/5 space-y-2">
          <Input label="IP Address" placeholder="e.g. 103.45.67.89" value={newIp} onChange={(e) => setNewIp(e.target.value)} />
          <Input label="Label (optional)" placeholder="e.g. Shop Computer, Admin Home" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} loading={addMutation.isPending}>
              Add IP
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setAdding(false);
                setNewIp("");
                setNewLabel("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* IP list */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-card animate-pulse" />
          ))}
        </div>
      ) : ips.length === 0 ? (
        <p className="text-xs text-text-muted text-center py-4">No IPs whitelisted yet. Add your shop's IP address above.</p>
      ) : (
        <div className="space-y-2">
          {ips.map((ip: AllowedIpResponse) => (
            <div
              key={ip.id}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl
                         border border-border/30 bg-card/40"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono font-medium text-text-primary">{ip.ipAddress}</span>
                  {ip.label && <Badge variant="muted">{ip.label}</Badge>}
                </div>
                <p className="text-xs text-text-muted">
                  Added by {ip.addedByUsername} · {formatDateTime(ip.createdAt)}
                </p>
              </div>
              <Button size="icon-sm" variant="ghost" onClick={() => removeMutation.mutate(ip.id)} loading={removeMutation.isPending} title="Remove IP">
                <Trash2 className="h-3.5 w-3.5 text-danger" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
