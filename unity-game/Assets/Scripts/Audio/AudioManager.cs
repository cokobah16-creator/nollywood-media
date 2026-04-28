using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Audio;

namespace NACECA.NightRaid.Audio
{
    public class AudioManager : MonoBehaviour
    {
        public static AudioManager Instance { get; private set; }

        [Header("Mixer")]
        [SerializeField] private AudioMixer mixer;
        [SerializeField] private string masterParam = "MasterVolume";
        [SerializeField] private string sfxParam = "SFXVolume";
        [SerializeField] private string musicParam = "MusicVolume";

        [Header("Music")]
        [SerializeField] private AudioSource musicSource;
        [SerializeField] private AudioClip ambientTrack;
        [SerializeField] private AudioClip combatTrack;
        [SerializeField] private float crossfadeSeconds = 1.5f;

        [Header("SFX Pool")]
        [SerializeField] private int sfxVoices = 8;
        [SerializeField] private AudioMixerGroup sfxGroup;

        private readonly List<AudioSource> sfxPool = new();
        private int sfxCursor;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }

            Instance = this;
            DontDestroyOnLoad(gameObject);

            for (int i = 0; i < sfxVoices; i++)
            {
                var go = new GameObject($"SFXVoice_{i}");
                go.transform.SetParent(transform);
                var src = go.AddComponent<AudioSource>();
                src.playOnAwake = false;
                src.spatialBlend = 1f;
                src.outputAudioMixerGroup = sfxGroup;
                sfxPool.Add(src);
            }
        }

        public void PlaySfx(AudioClip clip, Vector3 position, float volume = 1f, float pitch = 1f)
        {
            if (clip == null || sfxPool.Count == 0) return;

            var src = sfxPool[sfxCursor];
            sfxCursor = (sfxCursor + 1) % sfxPool.Count;

            src.transform.position = position;
            src.clip = clip;
            src.volume = volume;
            src.pitch = pitch;
            src.Play();
        }

        public void PlayAmbient() => Crossfade(ambientTrack);
        public void PlayCombat() => Crossfade(combatTrack);

        private void Crossfade(AudioClip clip)
        {
            if (musicSource == null || clip == null) return;
            if (musicSource.clip == clip) return;

            StopAllCoroutines();
            StartCoroutine(CrossfadeRoutine(clip));
        }

        private System.Collections.IEnumerator CrossfadeRoutine(AudioClip next)
        {
            float t = 0f;
            float startVolume = musicSource.volume;
            while (t < crossfadeSeconds)
            {
                t += Time.unscaledDeltaTime;
                musicSource.volume = Mathf.Lerp(startVolume, 0f, t / crossfadeSeconds);
                yield return null;
            }

            musicSource.clip = next;
            musicSource.loop = true;
            musicSource.Play();

            t = 0f;
            while (t < crossfadeSeconds)
            {
                t += Time.unscaledDeltaTime;
                musicSource.volume = Mathf.Lerp(0f, 1f, t / crossfadeSeconds);
                yield return null;
            }
        }

        public void SetMasterVolume(float linear) => SetMixerLinear(masterParam, linear);
        public void SetSfxVolume(float linear) => SetMixerLinear(sfxParam, linear);
        public void SetMusicVolume(float linear) => SetMixerLinear(musicParam, linear);

        private void SetMixerLinear(string param, float linear)
        {
            if (mixer == null) return;
            float clamped = Mathf.Clamp(linear, 0.0001f, 1f);
            mixer.SetFloat(param, Mathf.Log10(clamped) * 20f);
        }
    }
}
