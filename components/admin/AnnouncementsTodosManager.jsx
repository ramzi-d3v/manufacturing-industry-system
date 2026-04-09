// components/dashboard/AnnouncementsTodosManager.jsx
"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  IconSpeakerphone,
  IconListCheck,
  IconPlus,
  IconEdit,
  IconTrash,
  IconUsers,
  IconCalendarEvent,
  IconFlag,
  IconFlagFilled,
  IconCheck,
  IconClock,
  IconGripVertical,
  IconSend,
  IconUserPlus,
  IconTargetArrow,
  IconCalendarDue,
  IconAlertTriangle,
  IconInfoCircle,
  IconLayoutGrid,
  IconLayoutList,
  IconFilter,
  IconSortAscending,
  IconSortDescending,
} from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  Timestamp,
  onSnapshot
} from "firebase/firestore";
import { cn } from "@/lib/utils";

const priorityConfig = {
  high: {
    label: "High",
    icon: IconAlertTriangle,
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    gradient: "from-red-500/20 to-red-600/10"
  },
  medium: {
    label: "Medium",
    icon: IconFlag,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    gradient: "from-yellow-500/20 to-yellow-600/10"
  },
  low: {
    label: "Low",
    icon: IconInfoCircle,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    gradient: "from-blue-500/20 to-blue-600/10"
  }
};

const SortableTodoItem = ({ todo, onToggle, onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const priority = priorityConfig[todo.priority?.toLowerCase()] || priorityConfig.medium;
  const PriorityIcon = priority.icon;
  const isCompleted = todo.completed || todo.status === "completed";

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className={cn(
        "group rounded-xl border transition-all duration-200",
        isCompleted 
          ? "bg-white/5 border-white/10 opacity-70" 
          : "bg-gradient-to-r from-white/5 to-transparent border-white/10 hover:border-green-500/30"
      )}>
        <div className="p-3">
          <div className="flex items-start gap-3">
            {/* Drag Handle */}
            <div {...listeners} className={cn(
              "cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-400 transition-colors mt-1",
              isCompleted && "cursor-default opacity-50"
            )}>
              <IconGripVertical size={16} />
            </div>
            
            {/* Checkbox */}
            <div className="mt-0.5">
              <div 
                onClick={() => !isCompleted && onToggle(todo.id)}
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
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <div className={cn(
                  "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium border",
                  priority.bg,
                  priority.border,
                  priority.color
                )}>
                  <PriorityIcon size={10} />
                  {priority.label}
                </div>
                <div className={cn(
                  "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-medium",
                  isCompleted 
                    ? "bg-green-500/10 text-green-400 border border-green-500/30"
                    : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30"
                )}>
                  {isCompleted ? <IconCheck size={8} /> : <IconClock size={8} />}
                  {isCompleted ? "Completed" : "Pending"}
                </div>
                <Badge variant="outline" className="text-[9px] bg-white/5 border-white/10">
                  <IconUsers size={8} className="mr-1" />
                  {todo.assignedTo === "all" ? "All Users" : `${todo.specificUsers?.length || 0} Assigned`}
                </Badge>
              </div>
              
              <p className={cn(
                "text-sm font-medium text-white transition-all",
                isCompleted && "line-through text-slate-500"
              )}>
                {todo.title}
              </p>
              
              {todo.description && !isCompleted && (
                <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">
                  {todo.description}
                </p>
              )}
              
              <div className="flex items-center gap-3 mt-2">
                {todo.dueDate && (
                  <span className="text-[9px] text-slate-500 flex items-center gap-1">
                    <IconCalendarDue size={9} />
                    Due: {new Date(todo.dueDate).toLocaleDateString()}
                  </span>
                )}
                <span className="text-[9px] text-slate-500 flex items-center gap-1">
                  <IconClock size={9} />
                  Created: {todo.createdAt?.toDate?.().toLocaleDateString() || "Just now"}
                </span>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-slate-500 hover:text-white"
                onClick={() => onEdit(todo)}
              >
                <IconEdit size={14} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-slate-500 hover:text-red-400"
                onClick={() => onDelete(todo.id)}
              >
                <IconTrash size={14} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export function AnnouncementsTodosManager({ adminUid, users = [] }) {
  const [announcements, setAnnouncements] = useState([]);
  const [todos, setTodos] = useState([]);
  const [activeTab, setActiveTab] = useState("announcements");
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewMode, setViewMode] = useState("list");
  
  // Form states
  const [announcementDialogOpen, setAnnouncementDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    content: "",
    targetAudience: "all"
  });
  const [selectedUsers, setSelectedUsers] = useState([]);
  
  const [todoDialogOpen, setTodoDialogOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [todoForm, setTodoForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    assignedTo: "all",
    dueDate: ""
  });
  const [todoSelectedUsers, setTodoSelectedUsers] = useState([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch announcements
  useEffect(() => {
    if (!adminUid) return;
    const announcementsRef = collection(db, "announcements", adminUid, "list");
    const q = query(announcementsRef, orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const announcementsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAnnouncements(announcementsData);
    });
    return () => unsubscribe();
  }, [adminUid]);

  // Fetch todos
  useEffect(() => {
    if (!adminUid) return;
    const todosRef = collection(db, "todos", adminUid, "list");
    const q = query(todosRef, orderBy("order", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const todosData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTodos(todosData);
    });
    return () => unsubscribe();
  }, [adminUid]);

  const handleSaveAnnouncement = async () => {
    if (!announcementForm.title || !announcementForm.content) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    setIsProcessing(true);
    try {
      const announcementsRef = collection(db, "announcements", adminUid, "list");
      const announcementData = {
        title: announcementForm.title,
        content: announcementForm.content,
        targetAudience: announcementForm.targetAudience,
        specificUsers: announcementForm.targetAudience === "specific" ? selectedUsers : [],
        updatedAt: Timestamp.now()
      };
      
      if (editingAnnouncement) {
        const announcementRef = doc(db, "announcements", adminUid, "list", editingAnnouncement.id);
        await updateDoc(announcementRef, announcementData);
        toast.success("Announcement updated successfully");
      } else {
        await addDoc(announcementsRef, {
          ...announcementData,
          createdAt: Timestamp.now(),
          createdBy: adminUid
        });
        toast.success("Announcement posted successfully");
      }
      
      setAnnouncementDialogOpen(false);
      resetAnnouncementForm();
    } catch (error) {
      console.error("Error saving announcement:", error);
      toast.error("Failed to save announcement");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (confirm("Are you sure you want to delete this announcement?")) {
      try {
        const announcementRef = doc(db, "announcements", adminUid, "list", id);
        await deleteDoc(announcementRef);
        toast.success("Announcement deleted successfully");
      } catch (error) {
        console.error("Error deleting announcement:", error);
        toast.error("Failed to delete announcement");
      }
    }
  };

  const handleSaveTodo = async () => {
    if (!todoForm.title) {
      toast.error("Please enter a task title");
      return;
    }
    
    setIsProcessing(true);
    try {
      const todosRef = collection(db, "todos", adminUid, "list");
      const todoData = {
        title: todoForm.title,
        description: todoForm.description,
        priority: todoForm.priority,
        assignedTo: todoForm.assignedTo,
        specificUsers: todoForm.assignedTo === "specific" ? todoSelectedUsers : [],
        dueDate: todoForm.dueDate || null,
        completed: false,
        updatedAt: Timestamp.now()
      };
      
      if (editingTodo) {
        const todoRef = doc(db, "todos", adminUid, "list", editingTodo.id);
        await updateDoc(todoRef, todoData);
        toast.success("Task updated successfully");
      } else {
        const maxOrder = todos.length > 0 ? Math.max(...todos.map(t => t.order || 0)) : -1;
        await addDoc(todosRef, {
          ...todoData,
          order: maxOrder + 1,
          createdAt: Timestamp.now(),
          createdBy: adminUid
        });
        toast.success("Task assigned successfully");
      }
      
      setTodoDialogOpen(false);
      resetTodoForm();
    } catch (error) {
      console.error("Error saving todo:", error);
      toast.error("Failed to save task");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleTodo = async (todoId) => {
    const todo = todos.find(t => t.id === todoId);
    if (!todo || todo.completed) return;
    
    try {
      const todoRef = doc(db, "todos", adminUid, "list", todoId);
      await updateDoc(todoRef, {
        completed: true,
        status: "completed",
        completedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      toast.success("Task marked as completed");
    } catch (error) {
      console.error("Error toggling todo:", error);
      toast.error("Failed to update task");
    }
  };

  const handleDeleteTodo = async (id) => {
    if (confirm("Are you sure you want to delete this task?")) {
      try {
        const todoRef = doc(db, "todos", adminUid, "list", id);
        await deleteDoc(todoRef);
        toast.success("Task deleted successfully");
      } catch (error) {
        console.error("Error deleting todo:", error);
        toast.error("Failed to delete task");
      }
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = todos.findIndex((item) => item.id === active.id);
      const newIndex = todos.findIndex((item) => item.id === over.id);
      const newTodos = arrayMove(todos, oldIndex, newIndex);
      setTodos(newTodos);
      
      const updates = newTodos.map((todo, index) => {
        const todoRef = doc(db, "todos", adminUid, "list", todo.id);
        return updateDoc(todoRef, { order: index });
      });
      
      try {
        await Promise.all(updates);
      } catch (error) {
        console.error("Error updating order:", error);
        toast.error("Failed to reorder tasks");
      }
    }
  };

  const resetAnnouncementForm = () => {
    setEditingAnnouncement(null);
    setAnnouncementForm({ title: "", content: "", targetAudience: "all" });
    setSelectedUsers([]);
  };

  const resetTodoForm = () => {
    setEditingTodo(null);
    setTodoForm({ title: "", description: "", priority: "medium", assignedTo: "all", dueDate: "" });
    setTodoSelectedUsers([]);
  };

  const stats = {
    totalAnnouncements: announcements.length,
    totalTasks: todos.length,
    completedTasks: todos.filter(t => t.completed).length,
    pendingTasks: todos.filter(t => !t.completed).length,
  };

  return (
    <div className="space-y-5">
      {/* Header Stats Cards */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-xl p-3 border border-purple-500/20">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <IconSpeakerphone size={16} className="text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.totalAnnouncements}</p>
              <p className="text-[10px] text-slate-500">Announcements</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-xl p-3 border border-blue-500/20">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <IconListCheck size={16} className="text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.totalTasks}</p>
              <p className="text-[10px] text-slate-500">Total Tasks</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-xl p-3 border border-green-500/20">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-green-500/20 flex items-center justify-center">
              <IconCheck size={16} className="text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-400">{stats.completedTasks}</p>
              <p className="text-[10px] text-slate-500">Completed</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 rounded-xl p-3 border border-yellow-500/20">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <IconClock size={16} className="text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-400">{stats.pendingTasks}</p>
              <p className="text-[10px] text-slate-500">Pending</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 w-1/4 ">
        <Button 
          onClick={() => setAnnouncementDialogOpen(true)}
          className="flex-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 h-10"
        >
          <IconPlus size={16} className="mr-2" />
          New Announcement
        </Button>
        <Button 
          onClick={() => setTodoDialogOpen(true)}
          className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 h-10"
        >
          <IconUserPlus size={16} className="mr-2" />
          Assign Task
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-white/5 rounded-lg p-1">
        <button
          onClick={() => setActiveTab("announcements")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
            activeTab === "announcements"
              ? "bg-purple-500/20 text-purple-400"
              : "text-slate-500 hover:text-slate-300"
          )}
        >
          <IconSpeakerphone size={14} />
          Announcements
          <Badge className="bg-white/10 text-[9px]">{stats.totalAnnouncements}</Badge>
        </button>
        <button
          onClick={() => setActiveTab("tasks")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
            activeTab === "tasks"
              ? "bg-green-500/20 text-green-400"
              : "text-slate-500 hover:text-slate-300"
          )}
        >
          <IconListCheck size={14} />
          Tasks
          <Badge className="bg-white/10 text-[9px]">{stats.pendingTasks} pending</Badge>
        </button>
      </div>

      {/* Announcements Tab Content */}
      {activeTab === "announcements" && (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {announcements.length === 0 ? (
            <div className="text-center py-12 bg-white/5 rounded-xl">
              <IconSpeakerphone size={48} className="mx-auto mb-3 text-slate-600" />
              <p className="text-sm text-slate-500">No announcements yet</p>
              <p className="text-xs text-slate-600 mt-1">Click "New Announcement" to post one</p>
            </div>
          ) : (
            announcements.map((ann) => (
              <div key={ann.id} className="bg-white/5 rounded-xl border border-white/10 p-4 hover:border-purple-500/30 transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-6 w-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <IconSpeakerphone size={12} className="text-purple-400" />
                      </div>
                      <h4 className="text-sm font-semibold text-white">{ann.title}</h4>
                      <Badge variant="outline" className="text-[9px] bg-white/5">
                        {ann.targetAudience === "all" ? "All Users" : `${ann.specificUsers?.length || 0} Users`}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{ann.content}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-[9px] text-slate-500 flex items-center gap-1">
                        <IconCalendarEvent size={9} />
                        {ann.createdAt?.toDate?.().toLocaleDateString() || "Just now"}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-slate-500 hover:text-white"
                      onClick={() => {
                        setEditingAnnouncement(ann);
                        setAnnouncementForm({
                          title: ann.title,
                          content: ann.content,
                          targetAudience: ann.targetAudience
                        });
                        setSelectedUsers(ann.specificUsers || []);
                        setAnnouncementDialogOpen(true);
                      }}
                    >
                      <IconEdit size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-slate-500 hover:text-red-400"
                      onClick={() => handleDeleteAnnouncement(ann.id)}
                    >
                      <IconTrash size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tasks Tab Content with Drag & Drop */}
      {activeTab === "tasks" && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={todos.map(t => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {todos.length === 0 ? (
                <div className="text-center py-12 bg-white/5 rounded-xl">
                  <IconListCheck size={48} className="mx-auto mb-3 text-slate-600" />
                  <p className="text-sm text-slate-500">No tasks assigned yet</p>
                  <p className="text-xs text-slate-600 mt-1">Click "Assign Task" to create one</p>
                </div>
              ) : (
                todos.map((todo) => (
                  <SortableTodoItem
                    key={todo.id}
                    todo={todo}
                    onToggle={handleToggleTodo}
                    onEdit={(todo) => {
                      setEditingTodo(todo);
                      setTodoForm({
                        title: todo.title,
                        description: todo.description || "",
                        priority: todo.priority,
                        assignedTo: todo.assignedTo,
                        dueDate: todo.dueDate || ""
                      });
                      setTodoSelectedUsers(todo.specificUsers || []);
                      setTodoDialogOpen(true);
                    }}
                    onDelete={handleDeleteTodo}
                  />
                ))
              )}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Announcement Dialog */}
      <Dialog open={announcementDialogOpen} onOpenChange={setAnnouncementDialogOpen}>
        <DialogContent className="bg-[#0f0f0f] border-white/10 rounded-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <IconSpeakerphone size={20} className="text-purple-400" />
              {editingAnnouncement ? "Edit Announcement" : "Create Announcement"}
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Share important updates with your team members
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm text-slate-400">Title</Label>
              <Input
                value={announcementForm.title}
                onChange={(e) => setAnnouncementForm({...announcementForm, title: e.target.value})}
                className="bg-white/5 border-white/10 mt-1.5 focus:border-purple-500/50"
                placeholder="Announcement title"
              />
            </div>
            <div>
              <Label className="text-sm text-slate-400">Content</Label>
              <Textarea
                value={announcementForm.content}
                onChange={(e) => setAnnouncementForm({...announcementForm, content: e.target.value})}
                className="bg-white/5 border-white/10 mt-1.5 min-h-[100px] focus:border-purple-500/50"
                placeholder="Write your announcement content..."
              />
            </div>
            <div>
              <Label className="text-sm text-slate-400">Target Audience</Label>
              <Select value={announcementForm.targetAudience} onValueChange={(v) => setAnnouncementForm({...announcementForm, targetAudience: v})}>
                <SelectTrigger className="bg-white/5 border-white/10 mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0f0f0f] border-white/10">
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="specific">Specific Users</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {announcementForm.targetAudience === "specific" && (
              <div>
                <Label className="text-sm text-slate-400">Select Users</Label>
                <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto border border-white/10 rounded-lg p-2">
                  {users.filter(u => u.isApproved && !u.isDeclined).map(user => (
                    <label key={user.uid} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.uid)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers([...selectedUsers, user.uid]);
                          } else {
                            setSelectedUsers(selectedUsers.filter(id => id !== user.uid));
                          }
                        }}
                        className="rounded border-white/20 bg-white/5"
                      />
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs bg-slate-700">
                          {(user.firstName?.[0] || user.email?.[0] || "?").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{user.firstName || user.email}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAnnouncementDialogOpen(false)} className="text-slate-400">
              Cancel
            </Button>
            <Button onClick={handleSaveAnnouncement} disabled={isProcessing} className="bg-purple-600 hover:bg-purple-700">
              {isProcessing ? "Saving..." : editingAnnouncement ? "Update" : "Post Announcement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Todo Dialog */}
      <Dialog open={todoDialogOpen} onOpenChange={setTodoDialogOpen}>
        <DialogContent className="bg-[#0f0f0f] border-white/10 rounded-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <IconListCheck size={20} className="text-green-400" />
              {editingTodo ? "Edit Task" : "Assign New Task"}
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Create and assign tasks to team members
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm text-slate-400">Task Title</Label>
              <Input
                value={todoForm.title}
                onChange={(e) => setTodoForm({...todoForm, title: e.target.value})}
                className="bg-white/5 border-white/10 mt-1.5 focus:border-green-500/50"
                placeholder="Enter task title"
              />
            </div>
            <div>
              <Label className="text-sm text-slate-400">Description</Label>
              <Textarea
                value={todoForm.description}
                onChange={(e) => setTodoForm({...todoForm, description: e.target.value})}
                className="bg-white/5 border-white/10 mt-1.5 min-h-[80px] focus:border-green-500/50"
                placeholder="Task description (optional)"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-slate-400">Priority</Label>
                <Select value={todoForm.priority} onValueChange={(v) => setTodoForm({...todoForm, priority: v})}>
                  <SelectTrigger className="bg-white/5 border-white/10 mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0f0f0f] border-white/10">
                    <SelectItem value="high">High Priority</SelectItem>
                    <SelectItem value="medium">Medium Priority</SelectItem>
                    <SelectItem value="low">Low Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm text-slate-400">Due Date</Label>
                <Input
                  type="date"
                  value={todoForm.dueDate}
                  onChange={(e) => setTodoForm({...todoForm, dueDate: e.target.value})}
                  className="bg-white/5 border-white/10 mt-1.5 focus:border-green-500/50"
                />
              </div>
            </div>
            <div>
              <Label className="text-sm text-slate-400">Assign To</Label>
              <Select value={todoForm.assignedTo} onValueChange={(v) => setTodoForm({...todoForm, assignedTo: v})}>
                <SelectTrigger className="bg-white/5 border-white/10 mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0f0f0f] border-white/10">
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="specific">Specific Users</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {todoForm.assignedTo === "specific" && (
              <div>
                <Label className="text-sm text-slate-400">Select Users</Label>
                <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto border border-white/10 rounded-lg p-2">
                  {users.filter(u => u.isApproved && !u.isDeclined).map(user => (
                    <label key={user.uid} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={todoSelectedUsers.includes(user.uid)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTodoSelectedUsers([...todoSelectedUsers, user.uid]);
                          } else {
                            setTodoSelectedUsers(todoSelectedUsers.filter(id => id !== user.uid));
                          }
                        }}
                        className="rounded border-white/20 bg-white/5"
                      />
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs bg-slate-700">
                          {(user.firstName?.[0] || user.email?.[0] || "?").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{user.firstName || user.email}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTodoDialogOpen(false)} className="text-slate-400">
              Cancel
            </Button>
            <Button onClick={handleSaveTodo} disabled={isProcessing} className="bg-green-600 hover:bg-green-700">
              {isProcessing ? "Saving..." : editingTodo ? "Update" : "Assign Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}