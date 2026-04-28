using NACECA.NightRaid.Core;
using NACECA.NightRaid.Enemy;
using NACECA.NightRaid.Player;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace NACECA.NightRaid.UI
{
    public class HUDController : MonoBehaviour
    {
        [Header("Health")]
        [SerializeField] private Image healthFill;
        [SerializeField] private TMP_Text healthLabel;

        [Header("Stealth")]
        [SerializeField] private Image stealthFill;

        [Header("Ammo")]
        [SerializeField] private TMP_Text ammoLabel;

        [Header("Status")]
        [SerializeField] private GameObject alarmIndicator;
        [SerializeField] private TMP_Text objectiveLabel;
        [SerializeField] private TMP_Text missionTimer;

        [Header("References")]
        [SerializeField] private PlayerHealth playerHealth;
        [SerializeField] private StealthMeter stealthMeter;
        [SerializeField] private WeaponController weapon;
        [SerializeField] private Mission.MissionManager missionManager;

        private void OnEnable()
        {
            if (playerHealth != null) playerHealth.OnHealthChanged += UpdateHealth;
            if (stealthMeter != null) stealthMeter.OnStealthChanged += UpdateStealth;
            if (weapon != null) weapon.OnAmmoChanged += UpdateAmmo;
            if (AlarmSystem.Instance != null)
            {
                AlarmSystem.Instance.OnAlarmRaised += _ => SetAlarmVisible(true);
                AlarmSystem.Instance.OnAlarmCleared += () => SetAlarmVisible(false);
            }
            if (missionManager != null)
            {
                missionManager.OnObjectiveUpdated += UpdateObjective;
            }
        }

        private void OnDisable()
        {
            if (playerHealth != null) playerHealth.OnHealthChanged -= UpdateHealth;
            if (stealthMeter != null) stealthMeter.OnStealthChanged -= UpdateStealth;
            if (weapon != null) weapon.OnAmmoChanged -= UpdateAmmo;
        }

        private void Update()
        {
            if (missionTimer != null && GameManager.Instance != null && GameManager.Instance.CurrentState == GameState.Playing)
            {
                float t = GameManager.Instance.MissionElapsedSeconds;
                int minutes = Mathf.FloorToInt(t / 60f);
                int seconds = Mathf.FloorToInt(t % 60f);
                missionTimer.text = $"{minutes:00}:{seconds:00}";
            }
        }

        private void UpdateHealth(float current, float max)
        {
            if (healthFill != null) healthFill.fillAmount = current / max;
            if (healthLabel != null) healthLabel.text = Mathf.CeilToInt(current).ToString();
        }

        private void UpdateStealth(float current, float max)
        {
            if (stealthFill != null) stealthFill.fillAmount = current / max;
        }

        private void UpdateAmmo(int magazine, int reserve)
        {
            if (ammoLabel != null) ammoLabel.text = $"{magazine} / {reserve}";
        }

        private void SetAlarmVisible(bool visible)
        {
            if (alarmIndicator != null) alarmIndicator.SetActive(visible);
        }

        private void UpdateObjective(string text)
        {
            if (objectiveLabel != null) objectiveLabel.text = text;
        }
    }
}
