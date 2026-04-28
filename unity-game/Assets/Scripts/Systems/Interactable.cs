using NACECA.NightRaid.Core;
using UnityEngine;
using UnityEngine.Events;

namespace NACECA.NightRaid.Systems
{
    public class Interactable : MonoBehaviour
    {
        [SerializeField] private string promptText = "Interact";
        [SerializeField] private float interactRange = 2.5f;
        [SerializeField] private UnityEvent onInteract;

        public string PromptText => promptText;
        public float InteractRange => interactRange;

        public void Interact(GameObject interactor)
        {
            onInteract?.Invoke();
        }
    }

    public class PlayerInteractor : MonoBehaviour
    {
        [SerializeField] private Camera fpCamera;
        [SerializeField] private float maxRange = 3f;
        [SerializeField] private LayerMask interactableMask = ~0;

        public Interactable Current { get; private set; }

        private void Update()
        {
            DetectInteractable();

            if (Current != null && InputReader.Instance != null && InputReader.Instance.InteractPressed)
            {
                Current.Interact(gameObject);
            }
        }

        private void DetectInteractable()
        {
            Current = null;
            if (fpCamera == null) return;

            if (Physics.Raycast(fpCamera.transform.position, fpCamera.transform.forward, out RaycastHit hit, maxRange, interactableMask, QueryTriggerInteraction.Collide))
            {
                if (hit.collider.TryGetComponent(out Interactable interactable) && hit.distance <= interactable.InteractRange)
                {
                    Current = interactable;
                }
            }
        }
    }
}
