using NACECA.NightRaid.Core;
using NACECA.NightRaid.Systems;
using TMPro;
using UnityEngine;

namespace NACECA.NightRaid.Mission
{
    public class MissionSummary : MonoBehaviour
    {
        [SerializeField] private GameObject panelRoot;
        [SerializeField] private TMP_Text titleLabel;
        [SerializeField] private TMP_Text resultLabel;
        [SerializeField] private TMP_Text statsLabel;

        private void OnEnable()
        {
            if (GameManager.Instance != null)
            {
                GameManager.Instance.OnStateChanged += HandleStateChanged;
            }
        }

        private void OnDisable()
        {
            if (GameManager.Instance != null)
            {
                GameManager.Instance.OnStateChanged -= HandleStateChanged;
            }
        }

        private void HandleStateChanged(GameState state)
        {
            if (state == GameState.MissionComplete)
            {
                Show("MISSION COMPLETE", true);
            }
            else if (state == GameState.MissionFailed)
            {
                Show("MISSION FAILED", false);
            }
            else if (panelRoot != null)
            {
                panelRoot.SetActive(false);
            }
        }

        private void Show(string headline, bool success)
        {
            if (panelRoot != null) panelRoot.SetActive(true);
            if (titleLabel != null) titleLabel.text = MissionManager.Instance?.Title ?? "Operation Night Raid";
            if (resultLabel != null) resultLabel.text = headline;

            if (statsLabel != null && GameManager.Instance != null)
            {
                float t = GameManager.Instance.MissionElapsedSeconds;
                int detections = GameManager.Instance.DetectionCount;
                statsLabel.text = $"Time: {Mathf.FloorToInt(t / 60f):00}:{Mathf.FloorToInt(t % 60f):00}\nDetections: {detections}\nStealth Bonus: {(detections == 0 ? "+50%" : "0%")}";
            }

            if (success)
            {
                var data = SaveSystem.Load();
                if (data.bestTimeSeconds <= 0f || GameManager.Instance.MissionElapsedSeconds < data.bestTimeSeconds)
                {
                    data.bestTimeSeconds = GameManager.Instance.MissionElapsedSeconds;
                }
                SaveSystem.Save(data);
            }
        }
    }
}
