using NACECA.NightRaid.Core;
using UnityEngine;

namespace NACECA.NightRaid.Player
{
    [RequireComponent(typeof(CharacterController))]
    public class PlayerController : MonoBehaviour
    {
        [Header("Movement")]
        [SerializeField] private float walkSpeed = 4f;
        [SerializeField] private float sprintSpeed = 7f;
        [SerializeField] private float crouchSpeed = 2f;
        [SerializeField] private float gravity = -20f;
        [SerializeField] private float jumpHeight = 1.2f;

        [Header("Stance")]
        [SerializeField] private float standingHeight = 1.8f;
        [SerializeField] private float crouchHeight = 1.0f;
        [SerializeField] private float stanceTransition = 8f;

        [Header("Camera")]
        [SerializeField] private Transform cameraPivot;
        [SerializeField] private float minPitch = -85f;
        [SerializeField] private float maxPitch = 85f;

        private CharacterController controller;
        private Vector3 verticalVelocity;
        private float pitch;
        private float currentSpeed;

        public float CurrentSpeed => currentSpeed;
        public bool IsCrouching => InputReader.Instance != null && InputReader.Instance.IsCrouching;
        public bool IsSprinting { get; private set; }
        public bool IsGrounded => controller.isGrounded;

        private void Awake()
        {
            controller = GetComponent<CharacterController>();
            Cursor.lockState = CursorLockMode.Locked;
        }

        private void Update()
        {
            if (InputReader.Instance == null) return;

            HandleLook();
            HandleStance();
            HandleMovement();
        }

        private void HandleLook()
        {
            var look = InputReader.Instance.Look;
            transform.Rotate(0f, look.x, 0f);

            pitch -= look.y;
            pitch = Mathf.Clamp(pitch, minPitch, maxPitch);

            if (cameraPivot != null)
            {
                cameraPivot.localRotation = Quaternion.Euler(pitch, 0f, 0f);
            }
        }

        private void HandleStance()
        {
            float targetHeight = IsCrouching ? crouchHeight : standingHeight;
            controller.height = Mathf.Lerp(controller.height, targetHeight, Time.deltaTime * stanceTransition);

            var center = controller.center;
            center.y = controller.height * 0.5f;
            controller.center = center;
        }

        private void HandleMovement()
        {
            var input = InputReader.Instance.Move;
            IsSprinting = InputReader.Instance.SprintHeld && !IsCrouching && input.y > 0f;

            float targetSpeed = IsCrouching ? crouchSpeed : (IsSprinting ? sprintSpeed : walkSpeed);
            currentSpeed = targetSpeed;

            Vector3 direction = (transform.right * input.x + transform.forward * input.y).normalized;
            Vector3 horizontal = direction * targetSpeed;

            if (controller.isGrounded && verticalVelocity.y < 0f)
            {
                verticalVelocity.y = -2f;
            }

            verticalVelocity.y += gravity * Time.deltaTime;

            controller.Move((horizontal + verticalVelocity) * Time.deltaTime);
        }
    }
}
