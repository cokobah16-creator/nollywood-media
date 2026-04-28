using UnityEngine;

namespace NACECA.NightRaid.Core
{
    public class InputReader : MonoBehaviour
    {
        public static InputReader Instance { get; private set; }

        public Vector2 Move { get; private set; }
        public Vector2 Look { get; private set; }
        public bool SprintHeld { get; private set; }
        public bool CrouchToggled { get; private set; }
        public bool FirePressed { get; private set; }
        public bool AimHeld { get; private set; }
        public bool ReloadPressed { get; private set; }
        public bool InteractPressed { get; private set; }
        public bool PausePressed { get; private set; }

        [SerializeField] private float lookSensitivity = 2f;

        private bool crouchState;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }

            Instance = this;
        }

        private void Update()
        {
            Move = new Vector2(Input.GetAxisRaw("Horizontal"), Input.GetAxisRaw("Vertical"));
            Look = new Vector2(Input.GetAxis("Mouse X"), Input.GetAxis("Mouse Y")) * lookSensitivity;
            SprintHeld = Input.GetKey(KeyCode.LeftShift);
            AimHeld = Input.GetMouseButton(1);
            FirePressed = Input.GetMouseButtonDown(0);
            ReloadPressed = Input.GetKeyDown(KeyCode.R);
            InteractPressed = Input.GetKeyDown(KeyCode.E);
            PausePressed = Input.GetKeyDown(KeyCode.Escape);

            if (Input.GetKeyDown(KeyCode.C))
            {
                crouchState = !crouchState;
                CrouchToggled = true;
            }
            else
            {
                CrouchToggled = false;
            }
        }

        public bool IsCrouching => crouchState;
    }
}
