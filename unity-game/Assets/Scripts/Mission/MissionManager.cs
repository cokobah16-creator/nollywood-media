using System;
using System.Collections.Generic;
using NACECA.NightRaid.Core;
using UnityEngine;

namespace NACECA.NightRaid.Mission
{
    [Serializable]
    public class Objective
    {
        public string id;
        public string description;
        public bool optional;
        [NonSerialized] public bool completed;
    }

    public class MissionManager : MonoBehaviour
    {
        public static MissionManager Instance { get; private set; }

        [SerializeField] private string missionTitle = "Operation Night Raid";
        [SerializeField] private List<Objective> objectives = new();

        public event Action<string> OnObjectiveUpdated;
        public event Action<Objective> OnObjectiveCompleted;
        public event Action OnAllObjectivesCompleted;

        public string Title => missionTitle;
        public IReadOnlyList<Objective> Objectives => objectives;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }

            Instance = this;
        }

        private void Start()
        {
            BroadcastCurrentObjective();
        }

        public void CompleteObjective(string id)
        {
            foreach (var obj in objectives)
            {
                if (obj.id != id || obj.completed) continue;

                obj.completed = true;
                OnObjectiveCompleted?.Invoke(obj);
                break;
            }

            if (AllRequiredCompleted())
            {
                OnAllObjectivesCompleted?.Invoke();
                GameManager.Instance?.CompleteMission();
            }
            else
            {
                BroadcastCurrentObjective();
            }
        }

        private bool AllRequiredCompleted()
        {
            foreach (var obj in objectives)
            {
                if (!obj.optional && !obj.completed) return false;
            }
            return true;
        }

        private void BroadcastCurrentObjective()
        {
            foreach (var obj in objectives)
            {
                if (!obj.completed)
                {
                    OnObjectiveUpdated?.Invoke(obj.description);
                    return;
                }
            }
        }
    }
}
