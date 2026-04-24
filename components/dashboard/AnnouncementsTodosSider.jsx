"use client";

import { useState, useEffect } from "react";
import {
  IconSpeakerphone,
  IconListCheck,
  IconCalendarEvent,
  IconFlag,
  IconFlagFilled,
  IconClock,
  IconCheck,
  IconUsers,
  IconEye,
  IconAlertTriangle,
  IconInfoCircle,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { 
  collection, 
  updateDoc, 
  doc, 
  query, 
  orderBy, 
  Timestamp,
  onSnapshot,
  getDocs,
  where
} from "firebase/firestore";
import { cn } from "@/lib/utils";

const priorityConfig = {
  high: {
    label: "High",
    icon: IconAlertTriangle,
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30"
  },
  medium: {
    label: "Medium",
    icon: IconFlag,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30"
  },
  low: {
    label: "Low",
    icon: IconInfoCircle,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30"
  }
};

export function AnnouncementsTodosSider({ adminUid, userUid }) {
  const [announcements, setAnnouncements] = useState([]);
  const [todos, setTodos] = useState([]);
  const [expandedAnnouncement, setExpandedAnnouncement] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch announcements from admin's collection (shared announcements)
  useEffect(() => {
    if (!adminUid) return;
    const announcementsRef = collection(db, "announcements", adminUid, "list");
    const q = query(announcementsRef, orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let announcementsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Filter announcements based on target audience
      announcementsData = announcementsData.filter(ann => {
        if (ann.targetAudience === "all") return true;
        if (ann.targetAudience === "specific" && ann.specificUsers) {
          return ann.specificUsers.includes(userUid);
        }
        return false;
      });
      
      setAnnouncements(announcementsData);
    });
    return () => unsubscribe();
  }, [adminUid, userUid]);

  // Fetch todos from user's own collection - todos/{userUid}/list
  useEffect(() => {
    if (!userUid) {
      setIsLoading(false);
      return;
    }
    
    console.log("Fetching todos for user:", userUid);
    const todosRef = collection(db, "todos", userUid, "list");
    const q = query(todosRef, orderBy("order", "asc"));
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const todosData = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          completed: doc.data().completed || false,
          status: doc.data().status || "pending"
        }));
        console.log("Todos loaded:", todosData.length);
        setTodos(todosData);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching todos:", error);
        setIsLoading(false);
      }
    );
    
    return () => unsubscribe();
  }, [userUid]);

  const handleToggleTodo = async (todoId, isCurrentlyCompleted) => {
    // Prevent un-completing tasks
    if (isCurrentlyCompleted) {
      toast.info("Completed tasks cannot be undone");
      return;
    }
    
    try {
      const todoRef = doc(db, "todos", userUid, "list", todoId);
      await updateDoc(todoRef, {
        completed: true,
        status: "completed",
        completedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      toast.success("Task completed! Great job!");
    } catch (error) {
      console.error("Error updating todo:", error);
      toast.error("Failed to update task");
    }
  };

  const getPriorityBadge = (priority) => {
    const config = priorityConfig[priority?.toLowerCase()] || priorityConfig.medium;
    const Icon = config.icon;
    return (
      <div className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border",
        config.bg,
        config.border,
        config.color
      )}>
        <Icon size={10} />
        {config.label}
      </div>
    );
  };

  const stats = {
    totalTasks: todos.length,
    completedTasks: todos.filter(t => t.completed).length,
    pendingTasks: todos.filter(t => !t.completed).length,
    completionRate: todos.length > 0 
      ? Math.round((todos.filter(t => t.completed).length / todos.length) * 100)
      : 0
  };

  if (isLoading) {
    return (
      <div className=" mt-2 space-y-5 scrollbar-hide">
        <div className="bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-purple-500/10 rounded-xl p-4 border border-white/10">
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse text-slate-500 text-sm">Loading tasks...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className=" scrollbar-hide mt-2">
      {/* Compact Header with Stats */}
      <div className="bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-purple-500/10 rounded-xl p-4 border border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <IconSpeakerphone size={16} className="text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Activity Center</h3>
              <p className="text-[10px] text-slate-500">Stay updated with latest announcements and tasks</p>
            </div>
          </div>
          {stats.totalTasks > 0 && (
            <div className="text-right">
              <div className="text-xs font-semibold text-white">{stats.completionRate}%</div>
              <div className="w-20 h-1 bg-white/10 rounded-full overflow-hidden mt-1">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all"
                  style={{ width: `${stats.completionRate}%` }}
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Quick Stats Row */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 scrollbar-hidec">
          <div className="text-center">
            <div className="text-lg font-bold text-white">{announcements.length}</div>
            <div className="text-[9px] text-slate-500">Announcements</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-white">{stats.totalTasks}</div>
            <div className="text-[9px] text-slate-500">Total Tasks</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-400">{stats.completedTasks}</div>
            <div className="text-[9px] text-slate-500">Completed</div>
          </div>
        </div>
      </div>
      
      {/* Announcements Section */}
      <div className="mt-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <IconSpeakerphone size={14} className="text-purple-400" />
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Latest Announcements</h4>
          </div>
          <Badge variant="outline" className="text-[9px] bg-white/5">
            {announcements.length} total
          </Badge>
        </div>
        
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-hide">
          {announcements.length === 0 ? (
            <div className="text-center py-8 bg-white/5 rounded-xl">
              <IconSpeakerphone size={32} className="mx-auto mb-2 text-slate-600" />
              <p className="text-xs text-slate-500">No announcements yet</p>
            </div>
          ) : (
            announcements.slice(0, 5).map((ann) => (
              <div 
                key={ann.id} 
                className="group relative overflow-hidden rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all cursor-pointer"
                onClick={() => setExpandedAnnouncement(expandedAnnouncement === ann.id ? null : ann.id)}
              >
                <div className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="h-5 w-5 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                          <IconSpeakerphone size={10} className="text-purple-400" />
                        </div>
                        <p className="text-xs font-medium text-white truncate">{ann.title}</p>
                      </div>
                      <div className={cn(
                        "text-[11px] text-slate-400 transition-all",
                        expandedAnnouncement === ann.id ? "block mt-2" : "line-clamp-2"
                      )}>
                        {ann.content}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[9px] text-slate-500 flex items-center gap-1">
                          <IconCalendarEvent size={8} />
                          {ann.createdAt?.toDate?.().toLocaleDateString() || "Just now"}
                        </span>
                        <Badge className="text-[9px] px-1.5 py-0.5 bg-purple-500/20 text-purple-300 border-purple-500/30 hover:bg-purple-500/30">
                          {ann.targetAudience === "all" ? "All Users" : "Personal"}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-slate-500 group-hover:text-slate-300 transition-colors">
                      <IconEye size={14} />
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Tasks Section */}
      <div className="mt-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <IconListCheck size={14} className="text-green-400" />
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">My Tasks</h4>
          </div>
          <Badge variant="outline" className="text-[9px] bg-white/5">
            {stats.pendingTasks} pending
          </Badge>
        </div>
        
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
          {todos.length === 0 ? (
            <div className="text-center py-8 bg-white/5 rounded-xl">
              <IconListCheck size={32} className="mx-auto mb-2 text-slate-600" />
              <p className="text-xs text-slate-500">No tasks assigned yet</p>
              <p className="text-[10px] text-slate-600 mt-1">Check back later for new tasks</p>
            </div>
          ) : (
            todos.map((todo) => {
              const isCompleted = todo.completed;
              const priority = priorityConfig[todo.priority?.toLowerCase()] || priorityConfig.medium;
              const PriorityIcon = priority.icon;
              
              return (
                <div 
                  key={todo.id} 
                  className={cn(
                    "rounded-xl border transition-all group",
                    isCompleted 
                      ? "bg-white/5 border-white/10 opacity-60" 
                      : "bg-gradient-to-r from-white/5 to-transparent border-white/10 hover:border-green-500/30"
                  )}
                >
                  <div className="p-3">
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5">
                        <div 
                          onClick={() => handleToggleTodo(todo.id, isCompleted)}
                          className={cn(
                            "w-4 h-4 rounded border-2 transition-all cursor-pointer",
                            isCompleted 
                              ? "bg-green-500 border-green-500" 
                              : "border-slate-500 hover:border-green-500"
                          )}
                        >
                          {isCompleted && <IconCheck size={12} className="text-white -mt-0.5 ml-0.5" />}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <div className={cn(
                            "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium border",
                            priority.bg,
                            priority.border,
                            priority.color
                          )}>
                            <PriorityIcon size={8} />
                            {priority.label}
                          </div>
                          <div className={cn(
                            "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-medium",
                            isCompleted 
                              ? "bg-green-500/10 text-green-400"
                              : "bg-yellow-500/10 text-yellow-400"
                          )}>
                            {isCompleted ? <IconCheck size={8} /> : <IconClock size={8} />}
                            {isCompleted ? "Done" : "In Progress"}
                          </div>
                          {todo.assignedTo && (
                            <div className="inline-flex items-center gap-1 text-[8px] text-slate-500">
                              <IconUsers size={8} />
                              {todo.assignedTo === "all" ? "Team Task" : "Personal"}
                            </div>
                          )}
                        </div>
                        <p className={cn(
                          "text-sm font-medium transition-all",
                          isCompleted && "line-through text-slate-500"
                        )}>
                          {todo.title}
                        </p>
                        {todo.description && !isCompleted && (
                          <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">
                            {todo.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {todo.dueDate && (
                            <span className="text-[9px] text-slate-500 flex items-center gap-1">
                              <IconCalendarEvent size={8} />
                              Due: {typeof todo.dueDate === "string" 
                                ? new Date(todo.dueDate).toLocaleDateString() 
                                : todo.dueDate?.toDate?.().toLocaleDateString() || "No date"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}