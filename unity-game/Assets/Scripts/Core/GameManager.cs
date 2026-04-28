using System;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace NACECA.NightRaid.Core
{
    public enum GameState
    {
        MainMenu,
        Briefing,
        Playing,
        Paused,
        MissionComplete,
        MissionFailed
    }

    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance { get; private set; }

        public event Action<GameState> OnStateChanged;
        public event Action OnMissionStarted;
        public event Action OnMissionEnded;

        [SerializeField] private string mainMenuScene = "MainMenu";
        [SerializeField] private string firstMissionScene = "Mission01_Lagos";

        private GameState currentState = GameState.MainMenu;
        private float missionStartTime;
        private int detectionCount;

        public GameState CurrentState => currentState;
        public float MissionElapsedSeconds => Time.time - missionStartTime;
        public int DetectionCount => detectionCount;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }

            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        public void StartNewGame()
        {
            SceneManager.LoadScene(firstMissionScene);
            SetState(GameState.Briefing);
        }

        public void BeginMission()
        {
            missionStartTime = Time.time;
            detectionCount = 0;
            SetState(GameState.Playing);
            OnMissionStarted?.Invoke();
        }

        public void CompleteMission()
        {
            SetState(GameState.MissionComplete);
            OnMissionEnded?.Invoke();
        }

        public void FailMission()
        {
            SetState(GameState.MissionFailed);
            OnMissionEnded?.Invoke();
        }

        public void TogglePause()
        {
            if (currentState == GameState.Playing)
            {
                Time.timeScale = 0f;
                SetState(GameState.Paused);
            }
            else if (currentState == GameState.Paused)
            {
                Time.timeScale = 1f;
                SetState(GameState.Playing);
            }
        }

        public void ReturnToMenu()
        {
            Time.timeScale = 1f;
            SceneManager.LoadScene(mainMenuScene);
            SetState(GameState.MainMenu);
        }

        public void RegisterDetection()
        {
            detectionCount++;
        }

        private void SetState(GameState next)
        {
            if (currentState == next) return;
            currentState = next;
            OnStateChanged?.Invoke(next);
        }
    }
}
