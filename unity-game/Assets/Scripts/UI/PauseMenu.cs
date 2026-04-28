using NACECA.NightRaid.Core;
using UnityEngine;

namespace NACECA.NightRaid.UI
{
    public class PauseMenu : MonoBehaviour
    {
        [SerializeField] private GameObject pauseRoot;

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

        private void Update()
        {
            if (InputReader.Instance != null && InputReader.Instance.PausePressed)
            {
                GameManager.Instance?.TogglePause();
            }
        }

        private void HandleStateChanged(GameState state)
        {
            bool paused = state == GameState.Paused;
            if (pauseRoot != null) pauseRoot.SetActive(paused);
            Cursor.lockState = paused ? CursorLockMode.None : CursorLockMode.Locked;
            Cursor.visible = paused;
        }

        public void OnResumeClicked() => GameManager.Instance?.TogglePause();
        public void OnReturnToMenuClicked() => GameManager.Instance?.ReturnToMenu();
        public void OnQuitClicked()
        {
#if UNITY_EDITOR
            UnityEditor.EditorApplication.isPlaying = false;
#else
            Application.Quit();
#endif
        }
    }
}
