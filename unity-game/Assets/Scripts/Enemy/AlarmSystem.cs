using System;
using System.Collections;
using UnityEngine;

namespace NACECA.NightRaid.Enemy
{
    public class AlarmSystem : MonoBehaviour
    {
        public static AlarmSystem Instance { get; private set; }

        [SerializeField] private float alarmDuration = 30f;
        [SerializeField] private float reinforcementDelay = 8f;
        [SerializeField] private GameObject reinforcementPrefab;
        [SerializeField] private Transform[] reinforcementSpawns;
        [SerializeField] private AudioSource alarmSiren;

        public event Action<Vector3> OnAlarmRaised;
        public event Action OnAlarmCleared;

        public bool IsAlarmActive { get; private set; }
        public Vector3 LastAlarmOrigin { get; private set; }

        private Coroutine alarmRoutine;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }

            Instance = this;
        }

        public void RaiseAlarm(Vector3 origin)
        {
            LastAlarmOrigin = origin;

            if (IsAlarmActive)
            {
                return;
            }

            IsAlarmActive = true;
            OnAlarmRaised?.Invoke(origin);

            if (alarmSiren != null)
            {
                alarmSiren.Play();
            }

            if (alarmRoutine != null)
            {
                StopCoroutine(alarmRoutine);
            }

            alarmRoutine = StartCoroutine(AlarmCycle());
        }

        private IEnumerator AlarmCycle()
        {
            yield return new WaitForSeconds(reinforcementDelay);
            SpawnReinforcements();

            yield return new WaitForSeconds(alarmDuration - reinforcementDelay);
            ClearAlarm();
        }

        private void SpawnReinforcements()
        {
            if (reinforcementPrefab == null || reinforcementSpawns == null) return;

            foreach (var spawn in reinforcementSpawns)
            {
                if (spawn == null) continue;
                Instantiate(reinforcementPrefab, spawn.position, spawn.rotation);
            }
        }

        public void ClearAlarm()
        {
            if (!IsAlarmActive) return;
            IsAlarmActive = false;
            if (alarmSiren != null) alarmSiren.Stop();
            OnAlarmCleared?.Invoke();
        }
    }
}
