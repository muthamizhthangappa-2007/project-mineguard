// Hindi phrase to English translation mappings for realistic mining safety terms
const HINDI_MINING_TRANSLATIONS: Record<string, string> = {
  'कन्वेयर बेल्ट का गार्ड टूट गया है': 'The conveyor belt guard is damaged.',
  'कन्वेयर बेल्ट का गार्ड टूट गया है।': 'The conveyor belt guard is damaged.',
  'कन्वेयर बेल्ट का रोलर जाम हो गया है': 'The conveyor belt roller is jammed.',
  'कन्वेयर बेल्ट से धुआं निकल रहा है': 'Smoke is emitting from the conveyor belt drive.',
  'पानी का पंप खराब हो गया है': 'The water dewatering pump has malfunctioned.',
  'इलेक्ट्रिकल पैनल में स्पार्क हो रहा है': 'Sparks observed in the electrical distribution panel.',
  'छत से पत्थर गिर रहा है': 'Loose stone and strata falling observed from the roof.',
  'वेंटिलेशन पंखा बंद है': 'The primary ventilation fan has stopped operating.',
  'डंपर का ब्रेक काम नहीं कर रहा है': 'The heavy mining dump truck braking system is failing.',
  'धूल नियंत्रण स्प्रिंकलर काम नहीं कर रहा है': 'The dust suppression mist sprinkler is inoperative.',
  'वर्कर ने हेलमेट और जूते नहीं पहने हैं': 'Worker observed without required safety helmet and safety boots.',
  'गैस का रिसाव हो रहा है': 'Abnormal inflammable gas leakage detected at the face.',
};

export const translateHindiToEnglish = (hindiText: string): string => {
  const trimmed = hindiText.trim();
  if (HINDI_MINING_TRANSLATIONS[trimmed]) {
    return HINDI_MINING_TRANSLATIONS[trimmed];
  }

  // Word-by-word intelligent replacement fallback for mining terms
  let translated = trimmed;
  const wordMap: [RegExp, string][] = [
    [/कन्वेयर बेल्ट/gi, 'conveyor belt'],
    [/गार्ड/gi, 'guard'],
    [/टूट गया है/gi, 'is broken / damaged'],
    [/खराब हो गया है/gi, 'has broken down'],
    [/रोलर/gi, 'roller'],
    [/जाम/gi, 'jammed'],
    [/धुआं/gi, 'smoke'],
    [/आग/gi, 'fire'],
    [/पंप/gi, 'pump'],
    [/पानी/gi, 'water'],
    [/इलेक्ट्रिकल/gi, 'electrical'],
    [/पैनल/gi, 'panel'],
    [/स्पार्क/gi, 'spark'],
    [/छत/gi, 'roof / strata'],
    [/पत्थर/gi, 'stone / rock fall'],
    [/गिर रहा है/gi, 'is falling'],
    [/पंखा/gi, 'fan'],
    [/डंपर/gi, 'dumper'],
    [/ब्रेक/gi, 'brake'],
    [/गैस/gi, 'methane / gas'],
    [/खतरा/gi, 'hazard'],
  ];

  for (const [regex, replacement] of wordMap) {
    translated = translated.replace(regex, replacement);
  }

  if (translated !== trimmed) {
    return `Safety Observation: ${translated}`;
  }

  return `Observation: ${trimmed}`;
};

export class HindiSpeechRecognitionManager {
  private recognition: any = null;
  public isSupported: boolean = false;

  constructor() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.isSupported = true;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'hi-IN'; // Set to Hindi
    }
  }

  public startListening(
    onResult: (transcript: string, english: string) => void,
    onError: (error: string) => void,
    onEnd: () => void
  ) {
    if (!this.recognition) {
      onError('Speech recognition is not supported in this browser. Please use manual voice simulation or text input.');
      return;
    }

    this.recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      const english = translateHindiToEnglish(transcript);
      onResult(transcript, english);
    };

    this.recognition.onerror = (event: any) => {
      onError(event.error || 'Speech recognition encountered an error.');
    };

    this.recognition.onend = () => {
      onEnd();
    };

    try {
      this.recognition.start();
    } catch (err: any) {
      onError(err.message || 'Could not start microphone');
    }
  }

  public stopListening() {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
  }
}
