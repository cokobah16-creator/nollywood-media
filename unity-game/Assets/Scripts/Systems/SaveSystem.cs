using System;
using System.IO;
using UnityEngine;

namespace NACECA.NightRaid.Systems
{
    [Serializable]
    public class SaveData
    {
        public string lastMissionScene;
        public string lastCheckpointId;
        public int detections;
        public float bestTimeSeconds;
        public bool[] missionsCompleted = new bool[8];
    }

    public static class SaveSystem
    {
        private const string FileName = "naceca_save.json";

        private static string FilePath => Path.Combine(Application.persistentDataPath, FileName);

        public static void Save(SaveData data)
        {
            try
            {
                string json = JsonUtility.ToJson(data, true);
                File.WriteAllText(FilePath, json);
            }
            catch (Exception ex)
            {
                Debug.LogError($"[SaveSystem] Failed to save: {ex.Message}");
            }
        }

        public static SaveData Load()
        {
            try
            {
                if (!File.Exists(FilePath)) return new SaveData();
                string json = File.ReadAllText(FilePath);
                return JsonUtility.FromJson<SaveData>(json) ?? new SaveData();
            }
            catch (Exception ex)
            {
                Debug.LogError($"[SaveSystem] Failed to load: {ex.Message}");
                return new SaveData();
            }
        }

        public static void Clear()
        {
            try
            {
                if (File.Exists(FilePath)) File.Delete(FilePath);
            }
            catch (Exception ex)
            {
                Debug.LogError($"[SaveSystem] Failed to delete save: {ex.Message}");
            }
        }
    }
}
