/**
 * Script for login.ejs
 */
// Validation Regexes.
const validUsername         = /^[a-zA-Z0-9_]{1,16}$/
const basicEmail            = /^\S+@\S+\.\S+$/
//const validEmail          = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i

// Login Elements
const loginCancelContainer  = document.getElementById('loginCancelContainer')
const loginCancelButton     = document.getElementById('loginCancelButton')
const loginEmailError       = document.getElementById('loginEmailError')
const loginUsername         = document.getElementById('loginUsername')
const loginPasswordError    = document.getElementById('loginPasswordError')
const loginPassword         = document.getElementById('loginPassword')
const checkmarkContainer    = document.getElementById('checkmarkContainer')
const loginRememberOption   = document.getElementById('loginRememberOption')
const loginButton           = document.getElementById('loginButton')
const loginForm             = document.getElementById('loginForm')
const loginMSButton         = document.getElementById('loginMSButton')

// Control variables.
let lu = false, lp = false

const loggerLogin = LoggerUtil1('%c[Login]', 'color: #000668; font-weight: bold')


/**
 * Show a login error.
 * 
 * @param {HTMLElement} element The element on which to display the error.
 * @param {string} value The error text.
 */
function showError(element, value){
    element.innerHTML = value
    element.style.opacity = 1
}

/**
 * Shake a login error to add emphasis.
 * 
 * @param {HTMLElement} element The element to shake.
 */
function shakeError(element){
    if(element.style.opacity == 1){
        element.classList.remove('shake')
        void element.offsetWidth
        element.classList.add('shake')
    }
}

/**
 * Validate that an email field is neither empty nor invalid.
 * 
 * @param {string} value The email value.
 */
function validateEmail(value){
    if(value){
        if(!basicEmail.test(value) && !validUsername.test(value)){
            showError(loginEmailError, Lang.queryJS('login.error.invalidValue'))
            loginDisabled(true)
            lu = false
        } else {
            loginEmailError.style.opacity = 0
            lu = true
            if(lp){
                loginDisabled(false)
            }
        }
    } else {
        lu = false
        showError(loginEmailError, Lang.queryJS('login.error.requiredValue'))
        loginDisabled(true)
    }
}

/**
 * Validate that the password field is not empty.
 * 
 * @param {string} value The password value.
 */
function validatePassword(value){
    if(value){
        loginPasswordError.style.opacity = 0
        lp = true
        if(lu){
            loginDisabled(false)
        }
    } else {
        lp = false
        showError(loginPasswordError, Lang.queryJS('login.error.invalidValue'))
        loginDisabled(true)
    }
}

// Emphasize errors with shake when focus is lost.
loginUsername.addEventListener('focusout', (e) => {
    validateEmail(e.target.value)
    shakeError(loginEmailError)
})
loginPassword.addEventListener('focusout', (e) => {
    validatePassword(e.target.value)
    shakeError(loginPasswordError)
})

// Validate input for each field.
loginUsername.addEventListener('input', (e) => {
    validateEmail(e.target.value)
})
loginPassword.addEventListener('input', (e) => {
    validatePassword(e.target.value)
})

/**
 * Enable or disable the login button.
 * 
 * @param {boolean} v True to enable, false to disable.
 */
function loginDisabled(v){
    if(loginButton.disabled !== v){
        loginButton.disabled = v
    }
}

/**
 * Enable or disable loading elements.
 * 
 * @param {boolean} v True to enable, false to disable.
 */
function loginLoading(v){
    if(v){
        loginButton.setAttribute('loading', v)
        loginButton.innerHTML = loginButton.innerHTML.replace(Lang.queryJS('login.login'), Lang.queryJS('login.loggingIn'))
    } else {
        loginButton.removeAttribute('loading')
        loginButton.innerHTML = loginButton.innerHTML.replace(Lang.queryJS('login.loggingIn'), Lang.queryJS('login.login'))
    }
}

/**
 * Enable or disable login form.
 * 
 * @param {boolean} v True to enable, false to disable.
 */
function formDisabled(v){
    loginDisabled(v)
    loginCancelButton.disabled = v
    loginUsername.disabled = v
    loginPassword.disabled = v
    if(v){
        checkmarkContainer.setAttribute('disabled', v)
    } else {
        checkmarkContainer.removeAttribute('disabled')
    }
    loginRememberOption.disabled = v
}

let loginViewOnSuccess = VIEWS.landing
let loginViewOnCancel = VIEWS.settings
let loginViewCancelHandler

function loginCancelEnabled(val){
    if(val){
        $(loginCancelContainer).show()
    } else {
        $(loginCancelContainer).hide()
    }
}

loginCancelButton.onclick = (e) => {
    switchView(getCurrentView(), loginViewOnCancel, 500, 500, () => {
        loginUsername.value = ''
        loginPassword.value = ''
        loginCancelEnabled(false)
        if(loginViewCancelHandler != null){
            loginViewCancelHandler()
            loginViewCancelHandler = null
        }
        if(loginViewOnSuccess === VIEWS.settings){
            if(hasRPC){
                DiscordWrapper.updateDetails('In the Settings...')
                DiscordWrapper.clearState()
            }
        } else {
            if(hasRPC){
                if(ConfigManager.getSelectedServer()){
                    const serv = DistroManager.getDistribution().getServer(ConfigManager.getSelectedServer())
                    DiscordWrapper.updateDetails('Ready to Play!')
                    DiscordWrapper.updateState('Modpack: ' + serv.getName())
                } else {
                    DiscordWrapper.updateDetails('Landing Screen...')
                }
            }
        }
    })
}

// Disable default form behavior.
loginForm.onsubmit = () => { return false }

// Bind login button behavior.
loginButton.addEventListener('click', () => {
    // Disable form.
    formDisabled(true)

    // Show loading stuff.
    loginLoading(true)

    AuthManager.addMojangAccount(loginUsername.value, loginPassword.value).then((value) => {
        updateSelectedAccount(value)
        loginButton.innerHTML = loginButton.innerHTML.replace(Lang.queryJS('login.loggingIn'), Lang.queryJS('login.success'))
        $('.circle-loader').toggleClass('load-complete')
        $('.checkmark').toggle()
        setTimeout(() => {
            switchView(VIEWS.login, loginViewOnSuccess, 500, 500, () => {
                // Temporary workaround
                if(loginViewOnSuccess === VIEWS.settings){
                    prepareSettings()
                    if(hasRPC){
                        DiscordWrapper.updateDetails('In the Settings...')
                        DiscordWrapper.clearState()
                    }
                } else {
                    if(hasRPC){
                        if(ConfigManager.getSelectedServer()){
                            const serv = DistroManager.getDistribution().getServer(ConfigManager.getSelectedServer())
                            DiscordWrapper.updateDetails('Ready to Play!')
                            DiscordWrapper.updateState('Modpack: ' + serv.getName())
                        } else {
                            DiscordWrapper.updateDetails('Landing Screen...')
                        }
                    }
                }
                loginViewOnSuccess = VIEWS.landing // Reset this for good measure.
                loginCancelEnabled(false) // Reset this for good measure.
                loginViewCancelHandler = null // Reset this for good measure.
                loginUsername.value = ''
                loginPassword.value = ''
                $('.circle-loader').toggleClass('load-complete')
                $('.checkmark').toggle()
                loginLoading(false)
                loginButton.innerHTML = loginButton.innerHTML.replace(Lang.queryJS('login.success'), Lang.queryJS('login.login'))
                formDisabled(false)
            })
        }, 1000)
    }).catch((displayableError) => {
        loginLoading(false)

        let actualDisplayableError
        if(isDisplayableError(displayableError)) {
            msftLoginLogger.error('Error while logging in.', displayableError)
            actualDisplayableError = displayableError
        } else {
            // Uh oh.
            msftLoginLogger.error('Unhandled error during login.', displayableError)
            actualDisplayableError = {
                title: 'Unknown Error During Login',
                desc: 'An unknown error has occurred. Please see the console for details.'
            }
        }

        setOverlayContent(actualDisplayableError.title, actualDisplayableError.desc, Lang.queryJS('login.tryAgain'))
        setOverlayHandler(() => {
            formDisabled(false)
            toggleOverlay(false)
        })
        toggleOverlay(true)
    })

})

loginMSButton.addEventListener('click', () => {
    // Show loading stuff.
    toggleOverlay(true, false, 'msOverlay')
    loginMSButton.disabled = true
    ipcRenderer.send('openMSALoginWindow', 'open')
})

ipcRenderer.on('MSALoginWindowReply', (_, ...arguments_) => {
    if (arguments_[0] === 'error') {
        loginMSButton.disabled = false
        loginLoading(false)
        switch (arguments_[1]) {
            case 'AlreadyOpenException': {
                setOverlayContent('ERROR', 'There is already a login window open!', 'OK')
                setOverlayHandler(() => {
                    toggleOverlay(false)
                    toggleOverlay(false, false, 'msOverlay')
                })
                toggleOverlay(true)
                return
            }
            case 'AuthNotFinished': {
                setOverlayContent('ERROR', 'You have to finish the login process to use Helios Launcher. The window will close by itself when you have successfully logged in.', 'OK')
                setOverlayHandler(() => {
                    toggleOverlay(false)
                    toggleOverlay(false, false, 'msOverlay')
                })
                toggleOverlay(true)
                return
            }
        }

    }
    toggleOverlay(false, false, 'msOverlay')
    const queryMap = arguments_[0]
    if (queryMap.has('error')) {
        let error = queryMap.get('error')
        let errorDesc = queryMap.get('error_description')
        if (error === 'access_denied') {
            error = 'ERRPR'
            errorDesc = 'To use the Helios Launcher, you must agree to the required permissions! Otherwise you can\'t use this launcher with Microsoft accounts.<br><br>Despite agreeing to the permissions you don\'t give us the possibility to do anything with your account, because all data will always be sent back to you (the launcher) IMMEDIATELY and WITHOUT WAY.'
        }
        setOverlayContent(error, errorDesc, 'OK')
        setOverlayHandler(() => {
            loginMSButton.disabled = false
            toggleOverlay(false)
        })
        toggleOverlay(true)
        return
    }

    // Disable form.
    formDisabled(true)

    const authCode = queryMap.get('code')
    AuthManager.addMSAccount(authCode).then(account => {
        updateSelectedAccount(account)
        loginButton.innerHTML = loginButton.innerHTML.replace(Lang.queryJS('login.loggingIn'), Lang.queryJS('login.success'))
        $('.circle-loader').toggleClass('load-complete')
        $('.checkmark').toggle()
        setTimeout(() => {
            switchView(VIEWS.login, loginViewOnSuccess, 500, 500, () => {
                // Temporary workaround
                if (loginViewOnSuccess === VIEWS.settings) {
                    prepareSettings()
                }
                loginViewOnSuccess = VIEWS.landing // Reset this for good measure.
                loginCancelEnabled(false) // Reset this for good measure.
                loginViewCancelHandler = null // Reset this for good measure.
                loginUsername.value = ''
                loginPassword.value = ''
                $('.circle-loader').toggleClass('load-complete')
                $('.checkmark').toggle()
                loginLoading(false)
                loginButton.innerHTML = loginButton.innerHTML.replace(Lang.queryJS('login.success'), Lang.queryJS('login.login'))
                formDisabled(false)
                toggleOverlay(false)
                toggleOverlay(false, false, 'msOverlay')
            })
        }, 1000)
    }).catch(error => {
        loginMSButton.disabled = false
        loginLoading(false)
        setOverlayContent('ERROR', error.message ? error.message : 'An error occurred while logging in with Microsoft! For more detailed information please check the log. You can open it with CTRL + SHIFT + I.', Lang.queryJS('login.tryAgain'))
        setOverlayHandler(() => {
            formDisabled(false)
            toggleOverlay(false)
        })
        toggleOverlay(true)
        loggerLogin.error(error)
    })
})
