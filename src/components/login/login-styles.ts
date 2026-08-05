import { StyleSheet } from 'react-native';

import { COLORS } from './colors';

export const OTP_LENGTH = 6;
export const RESEND_TIMER = 30;
export const TOTAL_STEPS = 4;

export const loginStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  safeArea: { flex: 1 },

  // ─── Top bar (back + dots) ───
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: { fontSize: 26, fontWeight: '600', color: COLORS.navy, marginTop: -2 },

  // ─── Step dots ───
  dotsRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotInactive: { backgroundColor: COLORS.grayBorder },
  dotActive: { backgroundColor: COLORS.gold },
  dotCurrent: { width: 20, borderRadius: 4, backgroundColor: COLORS.gold },

  // ─── Step icon ───
  stepIconWrap: { alignItems: 'center', marginVertical: 5 },
  stepIconCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  stepIconEmoji: { fontSize: 32 },
  otpHeroWrap: {
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    overflow: 'visible',
    zIndex: 1,
    transform: [{ scale: 2 }],
  },
  otpHeroImage: {
    width: '55%',
    maxWidth: 250,
    aspectRatio: 1,
  },

  // ─── Content ───
  content: { paddingHorizontal: 28, paddingTop: 3 },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.navy },
  subtitle: { fontSize: 15, color: COLORS.gray, marginTop: 6, lineHeight: 22, textAlign: 'center' },

  // ─── Inputs ───
  inputGroup: { marginBottom: 14 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.grayBorder,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  iconBox: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 18 },
  inputField: { flex: 1, fontSize: 16, color: COLORS.navy, paddingVertical: 14 },

  floatLabel: { fontSize: 11, fontWeight: '600', color: COLORS.gray, marginBottom: 2 },
  phonePrefix: { flex: 1, paddingVertical: 8 },
  phonePrefixRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  phonePrefixCode: { fontSize: 16, fontWeight: '700', color: COLORS.navy },
  phoneInlineInput: { flex: 1, fontSize: 16, color: COLORS.navy, paddingVertical: 0 },

  // ─── OTP ───
  otpRow: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  otpBox: {
    width: 46,
    height: 58,
    borderWidth: 1.5,
    borderColor: COLORS.grayBorder,
    borderRadius: 16,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.navy,
    backgroundColor: COLORS.white,
  },
  otpBoxFilled: { borderColor: COLORS.purple, backgroundColor: COLORS.purpleSoft },
  otpBoxFocused: { borderColor: COLORS.purple },
  otpPhoneNumber: { fontSize: 15, fontWeight: '700', color: COLORS.navy },
  phoneEditRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 2 },
  editLink: { fontSize: 14, fontWeight: '600', color: COLORS.blue },
  resendRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  resendLabel: { fontSize: 13, color: COLORS.gray },
  resendLink: { fontSize: 13, fontWeight: '700', color: COLORS.blue },
  resendDisabled: { color: COLORS.grayLight },
  timerText: { textAlign: 'center', fontSize: 16, fontWeight: '700', color: COLORS.gold, marginTop: 8 },

  // ─── Button ───
  navyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.navy,
    borderRadius: 8,
    paddingVertical: 16,
    marginTop: 14,
    shadowColor: COLORS.navy,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  buttonPressed: { opacity: 0.8 },
  navyButtonText: { fontSize: 17, fontWeight: '700', color: COLORS.white },
  navyButtonArrow: { fontSize: 20, color: COLORS.white, position: 'absolute', right: 24 },

  // ─── Error ───
  errorBox: {
    backgroundColor: COLORS.errorBg,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    marginTop: 14,
  },
  errorText: { fontSize: 13, fontWeight: '600', color: COLORS.error },

  // ─── Assurance / terms ───
  assuranceText: { textAlign: 'center', fontSize: 13, color: COLORS.gray, marginTop: 14 },
  termsText: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.grayLight,
    lineHeight: 18,
    paddingHorizontal: 28,
    paddingBottom: 20,
    paddingTop: 8,
  },
  termsLink: { color: COLORS.blue, fontWeight: '600', textDecorationLine: 'underline' },

  // ─── Login (Welcome Back) ───
  loginContainer: { flex: 1, backgroundColor: COLORS.loginBg },
  loginScrollContent: { flexGrow: 1 },

  loginHero: { alignItems: 'center', paddingTop: 10 },
  loginBookImage: { width: '90%', maxWidth: 350, aspectRatio: 1, top: 30, alignSelf: 'center' },
  loginWelcome: { fontSize: 30, fontWeight: '600', color: COLORS.navy, marginTop: 2, textAlign: 'center', },
  fieldLabel: { fontSize: 14, fontWeight: '700', color: COLORS.navy, marginBottom: 8 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  countryCode: { fontSize: 16, fontWeight: '700', color: COLORS.navy, marginLeft: 16 },
  inputDivider: { width: 1, height: 22, backgroundColor: COLORS.grayBorder, marginHorizontal: 10 },
  inputLeadingIcon: { marginRight: 8 },
  eyeBtn: { paddingHorizontal: 12 },
  forgotPassword: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.purple,
  },
  purpleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    paddingVertical: 16,
    marginTop: 100,
    shadowColor: COLORS.purpleDark,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  purpleButtonText: { fontSize: 17, fontWeight: '700', color: COLORS.white },
  otpVerifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 18,
    marginTop: 24,
    shadowColor: COLORS.purpleDark,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  otpVerifyButtonText: { fontSize: 17, fontWeight: '700', color: COLORS.white },
  signUpRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 40, paddingBottom: 24 },
  signUpLabel: { fontSize: 14, color: COLORS.gray },
  signUpLink: { fontSize: 14, fontWeight: '700', color: COLORS.purple },
});
