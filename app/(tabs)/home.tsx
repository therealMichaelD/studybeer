// app/(tabs)/home.tsx

import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router"; // <--- NEW IMPORT
import React, { useCallback, useState } from "react"; // <--- CHANGED imports
import {
  ActivityIndicator,
  FlatList,
  LayoutAnimation,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";

import AnimatedReward, { RewardId } from "../../components/AnimatedReward";
import { theme } from "../../constants/theme";
import { supabase } from "../../lib/supabase";

// Enable LayoutAnimation for Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Task = {
  id: string;
  title: string;
  completed: boolean;
};

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [drinksEarned, setDrinksEarned] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rewardId, setRewardId] = useState<RewardId>("beer");

  // 🎯 Load tasks + drinks + reward WHENEVER SCREEN IS FOCUSED
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadData = async () => {
        try {
          setError(null);
          if (tasks.length === 0) setLoading(true);

          const {
            data: { user },
          } = await supabase.auth.getUser();
          
          if (!user || !isActive) {
            if (isActive) {
               setError("Not logged in.");
               setLoading(false);
            }
            return;
          }

          // 1. Load reward setting
          const { data: rewardData } = await supabase
            .from("reward_settings")
            .select("reward_id")
            .eq("user_id", user.id)
            .maybeSingle();

          if (isActive && rewardData?.reward_id) {
            setRewardId(rewardData.reward_id as RewardId);
          }

          // 2. Load Tasks
          const { data: tasksData, error: tasksError } = await supabase
            .from("tasks")
            .select("id, title, completed")
            .eq("user_id", user.id)
            .order("created_at", { ascending: true });

          if (isActive) {
            if (tasksError) {
              console.log("Load tasks error:", tasksError);
              setError("Could not load tasks.");
            } else {
              setTasks(tasksData || []);
            }
          }

          // 3. Load Drink Counter
          const { data: counterData, error: counterError } = await supabase
            .from("drink_counters")
            .select("total_drinks_earned")
            .eq("user_id", user.id)
            .maybeSingle();

          if (isActive) {
            if (counterError) {
              console.log("Load drink counter error:", counterError);
            } else if (counterData) {
              setDrinksEarned(counterData.total_drinks_earned ?? 0);
            } else {
              setDrinksEarned(0);
            }
          }
        } finally {
          if (isActive) setLoading(false);
        }
      };

      loadData();

      return () => {
        isActive = false;
      };
    }, [])
  );

  // 🔢 Progress calculation
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const progress = totalTasks === 0 ? 0 : completedTasks / totalTasks;

  // 🎯 Add a new task
  const handleAddTask = async () => {
    if (!newTask.trim()) return;

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSaving(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Not logged in.");
        setSaving(false);
        return;
      }

      const { data, error } = await supabase
        .from("tasks")
        .insert({
          user_id: user.id,
          title: newTask.trim(),
          completed: false,
        })
        .select("id, title, completed")
        .single();

      if (error) {
        console.log("Add task error:", error);
        setError("Could not add task.");
      } else if (data) {
        setTasks((prev) => [...prev, data as Task]);
        setNewTask("");
      }
    } finally {
      setSaving(false);
    }
  };

  // ✅ Toggle complete / incomplete
  const handleToggleTask = async (taskId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSaving(true);
    setError(null);

    try {
      const target = tasks.find((t) => t.id === taskId);
      if (!target) return;

      const newCompleted = !target.completed;

      const { error: updateError } = await supabase
        .from("tasks")
        .update({ completed: newCompleted })
        .eq("id", taskId);

      if (updateError) {
        console.log("Toggle task error:", updateError);
        setError("Could not update task.");
        return;
      }

      const updatedTasks = tasks.map((t) =>
        t.id === taskId ? { ...t, completed: newCompleted } : t
      );
      setTasks(updatedTasks);

      const total = updatedTasks.length;
      const completed = updatedTasks.filter((t) => t.completed).length;

      if (total > 0 && completed === total) {
        setTimeout(() => handleEarnDrinkAndReset(updatedTasks), 500);
      }
    } finally {
      setSaving(false);
    }
  };

  // 🗑️ Delete Task
  const handleDeleteTask = async (taskId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSaving(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskId);

      if (deleteError) {
        console.log("Delete task error:", deleteError);
        setError("Could not delete task.");
        return;
      }

      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      console.log("Delete error:", err);
      setError("Something went wrong deleting the task.");
    } finally {
      setSaving(false);
    }
  };

  // 🍺 When all tasks complete → earn 1 drink + clear task list
  const handleEarnDrinkAndReset = async (currentTasks: Task[]) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Not logged in.");
        return;
      }

      const newDrinksTotal = drinksEarned + 1;

      // Update drink counter
      const { error: counterError } = await supabase
        .from("drink_counters")
        .upsert(
          {
            user_id: user.id,
            total_drinks_earned: newDrinksTotal,
          },
          { onConflict: "user_id" }
        );

      if (counterError) {
        console.log("Update drink counter error:", counterError);
        setError("Could not update drink counter.");
        return;
      }

      // ✅ INSERT REWARD ENTRY INTO HISTORY
      await supabase.from("drinks_history").insert({
        user_id: user.id,
        reward_type: rewardId,
        quantity: 1,
      });

      // Delete all completed tasks
      const ids = currentTasks.map((t) => t.id);
      if (ids.length > 0) {
        const { error: deleteError } = await supabase
          .from("tasks")
          .delete()
          .in("id", ids);

        if (deleteError) {
          console.log("Delete tasks error:", deleteError);
        }
      }

      setTasks([]);
      setDrinksEarned(newDrinksTotal);
    } catch (e) {
      console.log("Earn drink error:", e);
      setError("Something went wrong awarding your drink.");
    }
  };

  if (loading && tasks.length === 0) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={theme.colors.neonGold} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* --- ANIMATED HERO PROGRESS COMPONENT --- */}
      <AnimatedReward
        progress={progress}
        drinksEarned={drinksEarned}
        totalTasks={totalTasks}
        completedTasks={completedTasks}
        rewardId={rewardId}
      />

      {/* --- INPUT AREA --- */}
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder="What needs to be done?"
          placeholderTextColor={theme.colors.textSecondary}
          value={newTask}
          onChangeText={setNewTask}
          returnKeyType="done"
          onSubmitEditing={handleAddTask}
        />
        <TouchableOpacity
          style={[
            styles.addButton,
            (!newTask.trim() || saving) && styles.disabledButton,
          ]}
          onPress={handleAddTask}
          disabled={saving || !newTask.trim()}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Ionicons name="arrow-up" size={20} color="#000" />
          )}
        </TouchableOpacity>
      </View>

      {/* --- ERROR BANNER --- */}
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="warning" size={16} color={theme.colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* --- TASK LIST --- */}
      <FlatList
        data={tasks}
        style={styles.taskList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="list" size={48} color={theme.colors.card} />
            <Text style={styles.emptyText}>Your list is empty.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View
            style={[
              styles.taskCard,
              item.completed && styles.taskCardCompleted,
            ]}
          >
            <TouchableOpacity
              style={styles.taskContentContainer}
              onPress={() => handleToggleTask(item.id)}
              activeOpacity={0.7}
              disabled={saving}
            >
              <View
                style={[
                  styles.checkbox,
                  item.completed && styles.checkboxActive,
                ]}
              >
                {item.completed && (
                  <Ionicons name="checkmark" size={14} color="#000" />
                )}
              </View>

              <Text
                style={[
                  styles.taskText,
                  item.completed && styles.taskTextCompleted,
                ]}
                numberOfLines={2}
              >
                {item.title}
              </Text>
            </TouchableOpacity>

            {item.completed ? (
              <View style={styles.completedBadge}>
                <Text style={styles.completedBadgeText}>DONE</Text>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => handleDeleteTask(item.id)}
                style={styles.deleteButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                disabled={saving}
              >
                <Ionicons
                  name="trash-outline"
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </View>
  );
}

// --------------- DESIGN SYSTEM ---------------

const styles = StyleSheet.create({
  center: { justifyContent: "center", alignItems: "center" },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: Platform.OS === "android" ? 48 : 50,
  },
  inputWrapper: {
    flexDirection: "row",
    marginHorizontal: 24,
    marginBottom: 16,
    alignItems: "center",
    backgroundColor: theme.colors.card,
    borderRadius: 50,
    paddingLeft: 20,
    paddingRight: 6,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  input: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: 16,
    height: 40,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.neonGold,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    backgroundColor: theme.colors.textSecondary,
    opacity: 0.5,
  },
  taskList: { flex: 1 },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    flexGrow: 1,
  },
  emptyState: { alignItems: "center", marginTop: 40, opacity: 0.5 },
  emptyText: {
    color: theme.colors.textSecondary,
    marginTop: 12,
    fontSize: 14,
    textAlign: "center",
    width: "70%",
  },
  taskCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    marginBottom: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    overflow: "hidden",
  },
  taskCardCompleted: {
    backgroundColor: "rgba(0,0,0,0.3)",
    borderColor: "transparent",
  },
  taskContentContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: theme.colors.textSecondary,
    marginRight: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {
    backgroundColor: theme.colors.neonGold,
    borderColor: theme.colors.neonGold,
  },
  taskText: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.textPrimary,
    fontWeight: "500",
  },
  taskTextCompleted: {
    color: theme.colors.textSecondary,
    textDecorationLine: "line-through",
  },
  deleteButton: {
    padding: 14,
    paddingLeft: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  completedBadge: {
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 14,
  },
  completedBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: theme.colors.neonGold,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 80, 80, 0.1)",
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 10,
    borderRadius: 12,
    gap: 8,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 13,
    fontWeight: "600",
  },
});