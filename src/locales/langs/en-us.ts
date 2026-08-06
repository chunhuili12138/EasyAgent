const local: App.I18n.Schema = {
  system: {
    title: 'EasyAgent',
    updateTitle: 'System Version Update Notification',
    updateContent: 'A new version of the system has been detected. Do you want to refresh the page immediately?',
    updateConfirm: 'Refresh immediately',
    updateCancel: 'Later'
  },
  common: {
    action: 'Action',
    create: 'Create',
    save: 'Save',
    on: 'Enabled',
    off: 'Disabled',
    requestFailed: 'Request failed',
    add: 'Add',
    addSuccess: 'Add Success',
    backToHome: 'Back to home',
    batchDelete: 'Batch Delete',
    cancel: 'Cancel',
    close: 'Close',
    check: 'Check',
    expandColumn: 'Expand Column',
    columnSetting: 'Column Setting',
    config: 'Config',
    confirm: 'Confirm',
    delete: 'Delete',
    deleteSuccess: 'Delete Success',
    confirmDelete: 'Are you sure you want to delete?',
    edit: 'Edit',
    warning: 'Warning',
    error: 'Error',
    index: 'Index',
    keywordSearch: 'Please enter keyword',
    logout: 'Logout',
    logoutConfirm: 'Are you sure you want to log out?',
    changePassword: 'Change Password',
    changePasswordTitle: 'Change Personal Password',
    currentPassword: 'Current Password',
    currentPasswordPlaceholder: 'Enter your current password',
    currentPasswordRequired: 'Enter your current password',
    newPassword: 'New Password',
    newPasswordPlaceholder: 'Use 6-18 characters with letters, numbers, and symbols',
    confirmNewPassword: 'Confirm New Password',
    confirmNewPasswordPlaceholder: 'Enter the new password again',
    newPasswordSame: 'The new password must be different from the current password',
    changePasswordSuccess: 'Password changed. Please log in again.',
    lookForward: 'Coming soon',
    modify: 'Modify',
    modifySuccess: 'Modify Success',
    noData: 'No Data',
    operate: 'Operate',
    pleaseCheckValue: 'Please check whether the value is valid',
    refresh: 'Refresh',
    reset: 'Reset',
    search: 'Search',
    switch: 'Switch',
    tip: 'Tip',
    trigger: 'Trigger',
    update: 'Update',
    updateSuccess: 'Update Success',
    userCenter: 'User Center',
    createTime: 'Create Time',
    status: 'Status',
    yesOrNo: {
      yes: 'Yes',
      no: 'No'
    }
  },
  request: {
    logout: 'Logout user after request failed',
    logoutMsg: 'User status is invalid, please log in again',
    logoutWithModal: 'Pop up modal after request failed and then log out user',
    logoutWithModalMsg: 'User status is invalid, please log in again',
    refreshToken: 'The requested token has expired, refresh the token',
    tokenExpired: 'The requested token has expired'
  },
  theme: {
    themeSchema: {
      title: 'Theme Schema',
      light: 'Light',
      dark: 'Dark',
      auto: 'Follow System'
    },
    grayscale: 'Grayscale',
    colourWeakness: 'Colour Weakness',
    layoutMode: {
      title: 'Layout Mode',
      vertical: 'Vertical Menu Mode',
      horizontal: 'Horizontal Menu Mode',
      'vertical-mix': 'Vertical Mix Menu Mode',
      'horizontal-mix': 'Horizontal Mix menu Mode',
      reverseHorizontalMix: 'Reverse first level menus and child level menus position'
    },
    recommendColor: 'Apply Recommended Color Algorithm',
    recommendColorDesc: 'The recommended color algorithm refers to',
    themeColor: {
      title: 'Theme Color',
      primary: 'Primary',
      info: 'Info',
      success: 'Success',
      warning: 'Warning',
      error: 'Error',
      followPrimary: 'Follow Primary'
    },
    scrollMode: {
      title: 'Scroll Mode',
      wrapper: 'Wrapper',
      content: 'Content'
    },
    page: {
      animate: 'Page Animate',
      mode: {
        title: 'Page Animate Mode',
        fade: 'Fade',
        'fade-slide': 'Slide',
        'fade-bottom': 'Fade Zoom',
        'fade-scale': 'Fade Scale',
        'zoom-fade': 'Zoom Fade',
        'zoom-out': 'Zoom Out',
        none: 'None'
      }
    },
    fixedHeaderAndTab: 'Fixed Header And Tab',
    header: {
      height: 'Header Height',
      breadcrumb: {
        visible: 'Breadcrumb Visible',
        showIcon: 'Breadcrumb Icon Visible'
      },
      multilingual: {
        visible: 'Display multilingual button'
      },
      globalSearch: {
        visible: 'Display global search button'
      }
    },
    tab: {
      visible: 'Tab Visible',
      cache: 'Tag Bar Info Cache',
      height: 'Tab Height',
      mode: {
        title: 'Tab Mode',
        chrome: 'Chrome',
        button: 'Button'
      }
    },
    sider: {
      inverted: 'Dark Sider',
      width: 'Sider Width',
      collapsedWidth: 'Sider Collapsed Width',
      mixWidth: 'Mix Sider Width',
      mixCollapsedWidth: 'Mix Sider Collapse Width',
      mixChildMenuWidth: 'Mix Child Menu Width'
    },
    footer: {
      visible: 'Footer Visible',
      fixed: 'Fixed Footer',
      height: 'Footer Height',
      right: 'Right Footer'
    },
    watermark: {
      visible: 'Watermark Full Screen Visible',
      text: 'Watermark Text',
      enableUserName: 'Enable User Name Watermark'
    },
    themeDrawerTitle: 'Theme Configuration',
    pageFunTitle: 'Page Function',
    configOperation: {
      copyConfig: 'Copy Config',
      copySuccessMsg: 'Copy Success, Please replace the variable "themeSettings" in "src/theme/settings.ts"',
      resetConfig: 'Reset Config',
      resetSuccessMsg: 'Reset Success'
    }
  },
  route: {
    automation: 'Automation',
    automation_event: 'Event Records',
    automation_failure: 'Failed Tasks',
    automation_log: 'Execution Logs',
    automation_run: 'Runs',
    automation_statistics: 'Statistics',
    automation_trigger: 'Triggers',
    automation_workflow: 'Workflow Design',
    login: 'Login',
    '403': 'No Permission',
    '404': 'Page Not Found',
    '500': 'Server Error',
    'iframe-page': 'Iframe',
    home: 'Statistics',
    system: 'System Management',
    system_user: 'User Management',
    system_role: 'Role Management',
    system_menu: 'Menu Management',
    system_tenant: 'Tenant Management',
    'system_tenant-usage': 'Tenant Usage',
    system_department: 'Department Management',
    system_post: 'Post Management',
    system_dict: 'Dictionary Management',
    system_message: 'Message Notifications',
    system_log: 'Audit Logs',
    document: 'Document Processing',
    document_kb: 'Knowledge Base Data',
    document_file: 'File Management',
    document_parse: 'Parse Management',
    document_process: 'Data Processing',
    'agent-workbench': 'Agent Workbench',
    rag: 'Agent Management',
    rag_skill: 'Skill Management',
    rag_datasource: 'Data Source',
    rag_tool: 'Tool Management',
    rag_experience: 'Experience Pool',
    'rag_sql-log': 'SQL Audit',
    'rag_bad-case': 'Bad Case Analysis',
    rag_audit: 'Operation Audit',
    'agent-workbench_chat': 'Smart Session',
    'system.user': 'User',
    'system.role': 'Role',
    'system.menu': 'Menu',
    'system.tenant': 'Tenant',
    'system.department': 'Department',
    'system.post': 'Post',
    'system.dict': 'Dictionary',
    'system.message': 'Message',
    'system.log': 'Log',
    'document.file': 'Document',
    'document.kb': 'Knowledge Base',
    'document.parse': 'Parse',
    'document.process': 'Process',
    'rag.skill': 'Skill',
    'rag.datasource': 'Datasource',
    'rag.tool': 'Tool',
    'rag.experience': 'Experience',
    'rag.sql-log': 'SQL Audit',
    'rag.bad-case': 'Bad Case',
    'rag.audit': 'Audit',
    'rag.chat': 'Smart Session',
    docs: 'User Guide',
    exception: 'Exception',
    exception_403: '403',
    exception_404: '404',
    exception_500: '500'
  },
  page: {
    docs: {
      button: 'User Guide',
      title: 'User Guide',
      subtitle: 'Platform features & usage',
      menu: 'Menu',
      back: 'Back to platform',
      lang: 'Language',
      darkMode: 'Switch to light mode',
      lightMode: 'Switch to dark mode',
      searchPlaceholder: 'Search docs',
      searchEmpty: 'No matching documents',
      toc: 'On this page',
      tocEmpty: 'No content',
      print: 'Print',
      prev: 'Previous',
      next: 'Next',
      copy: 'Copy',
      copied: 'Copied',
      underConstruction: 'This page is under construction'
    },
    login: {
      common: {
        loginOrRegister: 'Login / Register',
        userNamePlaceholder: 'Please enter user name',
        phonePlaceholder: 'Please enter phone number',
        codePlaceholder: 'Please enter verification code',
        passwordPlaceholder: 'Please enter password',
        confirmPasswordPlaceholder: 'Please enter password again',
        codeLogin: 'Verification code login',
        confirm: 'Confirm',
        back: 'Back',
        validateSuccess: 'Verification passed',
        loginSuccess: 'Login successfully',
        welcomeBack: 'Welcome back, {userName} !'
      },
      pwdLogin: {
        title: 'Password Login',
        rememberMe: 'Remember me',
        forgetPassword: 'Forget password?',
        register: 'Register',
        otherAccountLogin: 'Other Account Login',
        otherLoginMode: 'Other Login Mode',
        superAdmin: 'Super Admin',
        admin: 'Admin',
        user: 'User'
      },
      codeLogin: {
        title: 'Verification Code Login',
        getCode: 'Get verification code',
        reGetCode: 'Reacquire after {time}s',
        sendCodeSuccess: 'Verification code sent successfully',
        imageCodePlaceholder: 'Please enter image verification code'
      },
      register: {
        title: 'Register',
        agreement: 'I have read and agree to',
        protocol: '《User Agreement》',
        policy: '《Privacy Policy》'
      },
      resetPwd: {
        title: 'Reset Password'
      },
      bindWeChat: {
        title: 'Bind WeChat'
      }
    },
    about: {
      title: 'About',
      introduction: `SoybeanAdmin is an elegant and powerful admin template, based on the latest front-end technology stack, including Vue3, Vite5, TypeScript, Pinia and UnoCSS. It has built-in rich theme configuration and components, strict code specifications, and an automated file routing system. In addition, it also uses the online mock data solution based on ApiFox. SoybeanAdmin provides you with a one-stop admin solution, no additional configuration, and out of the box. It is also a best practice for learning cutting-edge technologies quickly.`,
      projectInfo: {
        title: 'Project Info',
        version: 'Version',
        latestBuildTime: 'Latest Build Time',
        githubLink: 'Github Link',
        previewLink: 'Preview Link'
      },
      prdDep: 'Production Dependency',
      devDep: 'Development Dependency'
    },
    home: {
      branchDesc:
        'For the convenience of everyone in developing and updating the merge, we have streamlined the code of the main branch, only retaining the homepage menu, and the rest of the content has been moved to the example branch for maintenance. The preview address displays the content of the example branch.',
      greeting: 'Good morning, {userName}, today is another day full of vitality!',
      weatherDesc: 'Today is cloudy to clear, 20℃ - 25℃!',
      projectCount: 'Project Count',
      todo: 'Todo',
      message: 'Message',
      downloadCount: 'Download Count',
      registerCount: 'Register Count',
      schedule: 'Work and rest Schedule',
      study: 'Study',
      work: 'Work',
      rest: 'Rest',
      entertainment: 'Entertainment',
      visitCount: 'Visit Count',
      turnover: 'Turnover',
      dealCount: 'Deal Count',
      projectNews: {
        title: 'Project News',
        moreNews: 'More News',
        desc1: 'Soybean created the open source project soybean-admin on May 28, 2021!',
        desc2: 'Yanbowe submitted a bug to soybean-admin, the multi-tab bar will not adapt.',
        desc3: 'Soybean is ready to do sufficient preparation for the release of soybean-admin!',
        desc4: 'Soybean is busy writing project documentation for soybean-admin!',
        desc5: 'Soybean just wrote some of the workbench pages casually, and it was enough to see!'
      },
      creativity: 'Creativity',
      title: 'Statistics',
      globalScope: 'Global platform data',
      tenantScope: 'Active tenant',
      refresh: 'Refresh',
      updatedAt: 'Updated at {time}',
      statusNormal: 'Operating normally',
      warningItems: '{count} items need attention',
      businessData: 'Business Data',
      metricCount: '{count} metrics available to your roles',
      noData: 'No statistics are available for the current roles',
      groups: {
        platform: 'Platform Overview',
        organization: 'Organization and Users',
        document: 'Document Processing',
        agent: 'Agent Configuration and Quality',
        activity: 'Sessions and Tasks',
        usage: 'Usage Statistics'
      },
      groupDescriptions: {
        platform: 'Overall platform scale across tenants and users',
        organization: 'Users, departments, and posts in the active tenant',
        document: 'Documents, parsing tasks, and knowledge-base indexing',
        agent: 'Professional configuration, experience quality, and open issues',
        activity: 'Personal or tenant sessions, questions, and pending actions'
      },
      resource: {
        title: 'Resource Usage',
        description: 'Shared document storage and model Token quotas for the active tenant',
        used: 'Used',
        remaining: 'Remaining',
        qps: 'Model request limit: {value} QPS',
        cacheHint:
          'Usage may be delayed by up to 5 minutes. New uploads or model calls are limited after a quota is exhausted.',
        items: {
          document: 'Document Storage',
          todayTokens: 'Tokens Today',
          monthTokens: 'Tokens This Month'
        },
        status: {
          normal: 'Quota Healthy',
          warning: 'Approaching Limit',
          danger: 'Quota Low',
          exceeded: 'Quota Exhausted'
        }
      },
      metrics: {
        activeTenants: 'Active Tenants',
        activeUsers: 'Active Users',
        tenantUsers: 'Tenant Users',
        departments: 'Departments',
        posts: 'Posts',
        documents: 'Documents',
        pendingParseTasks: 'Pending Parse Tasks',
        failedParseTasks: 'Failed Parse Tasks',
        indexedDocuments: 'Indexed Documents',
        activeSkills: 'Active Skills',
        activeDatasources: 'Active Data Sources',
        activeApiTools: 'Active API Tools',
        activeExperiences: 'Active Experiences',
        pendingBadCases: 'Pending Bad Cases',
        sqlIssues: 'Blocked or Failed SQL',
        mySessions: 'My Sessions',
        myQuestions: 'My Questions',
        pendingApprovals: 'Pending Approvals',
        readyAttachments: 'Ready Attachments',
        tenantSessions: 'Tenant Sessions',
        tenantQuestions: 'Tenant Questions',
        tenantPendingApprovals: 'Pending Tenant Approvals',
        tenantReadyAttachments: 'Ready Tenant Attachments',
        monthTokens: 'Monthly Tokens'
      }
    },
    function: {
      tab: {
        tabOperate: {
          title: 'Tab Operation',
          addTab: 'Add Tab',
          addTabDesc: 'To about page',
          closeTab: 'Close Tab',
          closeCurrentTab: 'Close Current Tab',
          closeAboutTab: 'Close "About" Tab',
          addMultiTab: 'Add Multi Tab',
          addMultiTabDesc1: 'To MultiTab page',
          addMultiTabDesc2: 'To MultiTab page(with query params)'
        },
        tabTitle: {
          title: 'Tab Title',
          changeTitle: 'Change Title',
          change: 'Change',
          resetTitle: 'Reset Title',
          reset: 'Reset'
        }
      },
      multiTab: {
        routeParam: 'Route Param',
        backTab: 'Back function_tab'
      },
      toggleAuth: {
        toggleAccount: 'Toggle Account',
        authHook: 'Auth Hook Function `hasAuth`',
        superAdminVisible: 'Super Admin Visible',
        adminVisible: 'Admin Visible',
        adminOrUserVisible: 'Admin and User Visible'
      },
      request: {
        repeatedErrorOccurOnce: 'Repeated Request Error Occurs Once',
        repeatedError: 'Repeated Request Error',
        repeatedErrorMsg1: 'Custom Request Error 1',
        repeatedErrorMsg2: 'Custom Request Error 2'
      }
    },
    alova: {
      scenes: {
        captchaSend: 'Captcha Send',
        autoRequest: 'Auto Request',
        visibilityRequestTips: 'Automatically request when switching browser window',
        pollingRequestTips: 'It will request every 3 seconds',
        networkRequestTips: 'Automatically request after network reconnecting',
        refreshTime: 'Refresh Time',
        startRequest: 'Start Request',
        stopRequest: 'Stop Request',
        requestCrossComponent: 'Request Cross Component',
        triggerAllRequest: 'Manually Trigger All Automated Requests'
      }
    },
    manage: {
      common: {
        status: {
          enable: 'Enable',
          disable: 'Disable'
        }
      },
      role: {
        title: 'Role List',
        roleName: 'Role Name',
        roleCode: 'Role Code',
        roleStatus: 'Role Status',
        roleDesc: 'Role Description',
        menuAuth: 'Menu Auth',
        buttonAuth: 'Button Auth',
        form: {
          roleName: 'Please enter role name',
          roleCode: 'Please enter role code',
          roleStatus: 'Please select role status',
          roleDesc: 'Please enter role description'
        },
        addRole: 'Add Role',
        editRole: 'Edit Role',
        menuPermission: 'Menu Permission'
      },
      user: {
        title: 'User List',
        userName: 'User Name',
        userGender: 'Gender',
        nickName: 'Nick Name',
        userPhone: 'Phone Number',
        userEmail: 'Email',
        userStatus: 'User Status',
        userRole: 'User Role',
        selectPost: 'Please select a post',
        selectDepartmentAndPost: 'Department and post must be selected together',
        selectTenant: 'Please select at least one tenant',
        selectRole: 'Please select at least one role',
        resetPwd: 'Reset Password',
        resetPwdHint: 'Leave empty to keep current password',
        resetPwdTitle: 'Reset Password',
        form: {
          userName: 'Please enter user name',
          userGender: 'Please select gender',
          nickName: 'Please enter nick name',
          userPhone: 'Please enter phone number',
          userEmail: 'Please enter email',
          userStatus: 'Please select user status',
          userRole: 'Please select user role'
        },
        addUser: 'Add User',
        editUser: 'Edit User',
        gender: {
          male: 'Male',
          female: 'Female'
        }
      },
      menu: {
        home: 'Home',
        title: 'Menu List',
        id: 'ID',
        parentId: 'Parent ID',
        menuType: 'Menu Type',
        menuName: 'Menu Name',
        routeName: 'Route Name',
        routePath: 'Route Path',
        path: 'Path',
        pathParam: 'Path Param',
        layout: 'Layout Component',
        page: 'Page Component',
        component: 'Component',
        i18nKey: 'I18n Key',
        icon: 'Icon',
        localIcon: 'Local Icon',
        iconTypeTitle: 'Icon Type',
        order: 'Order',
        constant: 'Constant',
        keepAlive: 'Keep Alive',
        href: 'Href',
        hideInMenu: 'Hide In Menu',
        activeMenu: 'Active Menu',
        multiTab: 'Multi Tab',
        fixedIndexInTab: 'Fixed Index In Tab',
        query: 'Query Params',
        button: 'Button',
        buttonCode: 'Button Code',
        buttonDesc: 'Button Desc',
        permission: 'Permission',
        visible: 'Visible',
        parent: 'Parent Menu',
        rootParent: 'Root (no parent)',
        menuStatus: 'Menu Status',
        form: {
          home: 'Please select home',
          menuType: 'Please select menu type',
          menuName: 'Please enter menu name',
          routeName: 'Please enter route name',
          routePath: 'Please enter route path',
          path: 'Please enter path',
          pathParam: 'Please enter path param',
          page: 'Please select page component',
          component: 'Please enter component path',
          layout: 'Please select layout component',
          i18nKey: 'Please enter i18n key',
          icon: 'Please enter iconify name',
          localIcon: 'Please enter local icon name',
          order: 'Please enter order',
          keepAlive: 'Please select whether to cache route',
          href: 'Please enter href',
          hideInMenu: 'Please select whether to hide menu',
          activeMenu: 'Please select route name of the highlighted menu',
          multiTab: 'Please select whether to support multiple tabs',
          fixedInTab: 'Please select whether to fix in the tab',
          fixedIndexInTab: 'Please enter the index fixed in the tab',
          queryKey: 'Please enter route parameter Key',
          queryValue: 'Please enter route parameter Value',
          button: 'Please select whether it is a button',
          buttonCode: 'Please enter button code',
          buttonDesc: 'Please enter button description',
          permission: 'Please enter permission identifier',
          menuStatus: 'Please select menu status'
        },
        addMenu: 'Add Menu',
        editMenu: 'Edit Menu',
        addChildMenu: 'Add Child Menu',
        addChild: 'Add Child Menu',
        deleteChildFirst: 'Please delete child menus first',
        type: {
          directory: 'Directory',
          menu: 'Menu'
        },
        iconType: {
          iconify: 'Iconify Icon',
          local: 'Local Icon'
        }
      },
      tenantUsage: {
        tenants: 'Tenants',
        documentTotal: 'Document Storage',
        monthTokens: 'Monthly Tokens',
        alertTenants: 'Alerts',
        search: 'Search tenant name or code',
        refresh: 'Refresh',
        tenant: 'Tenant',
        documentSpace: 'Document Space',
        todayTokens: 'Today Tokens',
        qps: 'QPS',
        status: 'Status',
        configure: 'Configure',
        trend: 'Trend',
        normal: 'Normal',
        warning: 'Near Limit',
        danger: 'High Risk',
        exceeded: 'Exceeded',
        quotaTitle: 'Configure Quota',
        documentLimit: 'Document Limit',
        dailyLimit: 'Daily Token Limit',
        monthlyLimit: 'Monthly Token Limit',
        qpsLimit: 'Model QPS',
        quotaSaved: 'Quota updated',
        trendTitle: 'Last 30 Days',
        date: 'Date',
        requests: 'Requests',
        noTrend: 'No model calls in the last 30 days'
      },
      tenant: {
        title: 'Tenant Management',
        addTenant: 'Add Tenant',
        editTenant: 'Edit Tenant',
        name: 'Tenant Name',
        code: 'Tenant Code',
        contact: 'Contact',
        contactPhone: 'Contact Phone',
        globalMode: 'Global Mode',
        selectTitle: 'Select Tenant',
        selectDescription: 'Your account is associated with multiple tenants. Please select one to continue.',
        form: {
          name: 'Please enter tenant name',
          code: 'Please enter tenant code',
          contactName: 'Please enter contact name',
          contactPhone: 'Please enter contact phone'
        }
      },
      department: {
        title: 'Department Management',
        addDepartment: 'Add Department',
        editDepartment: 'Edit Department',
        addChild: 'Add Child Department',
        parent: 'Parent Department',
        rootParent: 'Root (no parent)',
        name: 'Department Name',
        leader: 'Leader',
        phone: 'Phone',
        sort: 'Sort',
        deleteChildFirst: 'Please delete child departments first',
        form: {
          name: 'Please enter department name',
          leader: 'Please enter leader name',
          phone: 'Please enter contact phone'
        }
      },
      post: {
        title: 'Post Management',
        addPost: 'Add Post',
        editPost: 'Edit Post',
        name: 'Post Name',
        code: 'Post Code',
        sort: 'Sort',
        department: 'Department',
        selectDepartment: 'Please select department',
        allDepartments: 'All Departments',
        form: {
          name: 'Please enter post name',
          code: 'Please enter post code'
        }
      },
      dict: {
        title: 'Dictionary Management',
        dictType: 'Dict Type',
        dictData: 'Dict Data',
        addType: 'Add Dict Type',
        editType: 'Edit Dict Type',
        addData: 'Add Dict Data',
        editData: 'Edit Dict Data',
        selectTypeFirst: 'Please select a dict type first',
        name: 'Dict Name',
        code: 'Dict Code',
        label: 'Label',
        value: 'Value',
        sort: 'Sort',
        form: {
          name: 'Please enter dict name',
          code: 'Please enter dict code',
          label: 'Please enter label',
          value: 'Please enter value'
        }
      },
      message: {
        title: 'Message Notifications',
        markAllRead: 'Mark All as Read',
        markRead: 'Mark as Read',
        readStatus: 'Read Status',
        read: 'Read',
        unread: 'Unread',
        type: 'Message Type',
        info: 'Info',
        warning: 'Warning',
        success: 'Success',
        error: 'Error',
        docParse: 'Document Parse',
        docProcess: 'Document Process',
        all: 'All'
      },
      log: {
        title: 'Operation Logs',
        module: 'Module',
        status: 'Status',
        all: 'All',
        success: 'Success',
        fail: 'Fail',
        requestParams: 'Request Params',
        response: 'Response',
        na: 'N/A',
        startDate: 'Start date',
        endDate: 'End date',
        to: 'to',
        duration: 'Duration(ms)',
        requestUrl: 'Request URL',
        ip: 'IP',
        operation: 'Operation'
      },
      parse: {
        submitProcess: 'Submit Process',
        batchProcess: 'Batch Process',
        retry: 'Retry',
        delete: 'Delete',
        deleteConfirm: 'Delete Parse Record',
        deleteConfirmMessage:
          'Delete the parse record for "{name}"? Its processing results and knowledge-base data will also be removed, and the file will return to the unparsed state.',
        deleteSuccess: 'Parse record deleted',
        content: 'Content',
        viewContent: 'View Content',
        parseStatus: 'Parse Status',
        processStatus: 'Process Status',
        qualityScore: 'Score',
        duration: 'Duration',
        pending: 'Pending',
        parsing: 'Parsing',
        done: 'Parsed',
        failed: 'Failed',
        notProcessed: 'Not Processed',
        processing: 'Processing',
        processed: 'Processed',
        processFailed: 'Process Failed',
        retryProcess: 'Retry Process',
        retryProcessConfirm: 'Retry processing file "{name}"?',
        retryConfirm: 'Confirm retry?',
        saveContentConfirm:
          'Save the modified Markdown? This does not recalculate parse quality; the current score still describes the automatically parsed version.',
        confirmUpload: 'Confirm upload selected files?',
        confirmAclSave: 'Confirm save ACL changes?',
        saveChunkConfirm: 'Confirm save current chunk edits?',
        retryProcessSubmitted: 'Processing retry submitted',
        retrySubmitted: 'Retry task submitted',
        processSubmitted: 'Process task submitted',
        reprocessConfirm: 'Re-process Confirm',
        selectValid: 'Please select completed and unprocessed records',
        batchSubmitted: 'Batch process submitted',
        noContent: '(No content)',
        fileType: 'File Type',
        edit: 'Edit',
        save: 'Save',
        saveSuccess: 'Saved successfully',
        saveFailed: 'Save failed',
        submitProcessMsg: 'File "{name}" scored {score}/100, confirm to submit for processing?',
        reprocessMsgIndexed:
          'File "{name}" has been processed and indexed. Re-processing will clear all chunks, tags, Q&A and ES data. Continue?',
        reprocessMsgDone:
          'File "{name}" has been processed. Re-processing will clear all chunks, tags and Q&A data. Continue?',
        batchProcessConfirm: 'Confirm submit {n} files for data processing?',
        durationMinutes: '{count}min',
        durationSeconds: '{count}s',
        durationHours: '{count}h',
        aboutSeconds: 'About {count}s',
        aboutMinutes: 'About {count}min',
        aboutHours: 'About {count}h',
        scoreUnit: 'pts',
        metrics: 'Metrics',
        metricsTitle: 'Parse Quality and Stage Metrics',
        downloadStage: 'Download',
        extractionStage: 'Extraction',
        assessmentStage: 'Assessment',
        markdownStage: 'Markdown',
        contentCoverage: 'Content Coverage',
        numericCoverage: 'Value Preservation',
        structureScore: 'Structure Score',
        semanticRetries: 'Quality Retries',
        sourceFallbacks: 'Source Fallbacks',
        provider: 'Provider',
        model: 'Model',
        inputChars: 'Input Chars',
        outputChars: 'Output Chars',
        promptTokens: 'Prompt Tokens',
        completionTokens: 'Completion Tokens',
        taskType: 'Task Type',
        thinking: 'Thinking',
        reasoningTokens: 'Reasoning Tokens',
        retryCount: 'Retries',
        fallbackProvider: 'Fallback From',
        reprocess: 'Re-process',
        reprocessSubmitted: 'Re-process task submitted',
        queueDeferred: 'The worker queue is full. The task remains pending and will be dispatched automatically',
        queueDuplicate: 'This task is already queued or running and was not submitted again',
        manualEditScoreWarning:
          'Manual Markdown changes do not recalculate quality. Check headings, tables, numbers, and content completeness before submitting data processing.',
        parser: 'Parser Used',
        parserFallback: 'Parser Fallback',
        ocrPages: 'OCR Pages',
        ocrRegions: 'OCR Regions',
        ocrImages: 'OCR Images',
        ocrPreprocessing: 'Image Preprocessing',
        helpTitle: 'Document Parsing Guide',
        helpIntro:
          'Document parsing converts uploaded files into reviewable Markdown. The system selects a format-specific parser and automatically applies page OCR when PDF text is insufficient.',
        helpWorkflow:
          '1. Upload a file in File Management and create a parse task.\n2. Wait for Parsed; inspect the error before retrying failures.\n3. Open Metrics to verify the parser, OCR pages, content coverage, and numeric preservation.\n4. Open View Content and check headings, body text, tables, numbers, and reading order.\n5. Correct Markdown when necessary, then submit data processing.',
        helpEvidence:
          'PDF pages with usable text use native extraction; low-text or garbled pages are rendered and OCRed. Images may be rotated, resized, contrast-enhanced, denoised, and tiled. DOCX/PPTX use structure parsers first and fall back to Tika only on failure. pdf-native-ocr, ocrPages, ocrRegions, and ocrPreprocessing show whether enhancement actually ran.',
        helpActions:
          'Retry reruns a failed parse. Re-process removes old chunks, tags, and QA and also removes indexed data when present. Batch processing accepts only parsed, unprocessed records. A full worker queue does not lose the task; it remains pending for automatic dispatch.',
        helpNotes:
          'Parsed means the current quality gate passed, not that every complex layout was perfectly restored. Manual Markdown changes are not rescored, so the displayed score describes the automatic version. Scans still depend on the vision model; perspective distortion, handwriting, formulas, and unusual Office layouts require manual review.',
        guideWorkflow: 'Recommended workflow',
        guideEvidence: 'Processing logic and evidence',
        guideActions: 'Actions and state changes',
        guideNotes: 'Boundaries and cautions',
        fileName: 'File Name'
      },
      process: {
        title: 'Data Processing',
        helpTitle: 'Data Processing Guide',
        helpIntro:
          'Data processing turns reviewed Markdown into searchable parent/child chunks, keywords, summaries, QA, and vectors. Import only after reviewing the result.',
        helpWorkflow:
          '1. Submit processing from Document Parsing.\n2. Wait for chunking, labeling, summarizing, QA, and save to complete.\n3. Open the result and review chunk counts, QA coverage, and average quality.\n4. Walk the heading tree and inspect content, summary, tags, access scope, and QA for each chunk.\n5. Save necessary changes, then import or update the knowledge base when no edits remain unsaved.',
        helpEvidence:
          'Parent chunks retain section context; child chunks are the main retrieval units. The breadcrumb records the source heading path. Quality scores, low-quality chunks, section QA coverage, LLM calls, and token use indicate whether a result is ready. Visibility tags continue to restrict retrieval access.',
        helpActions:
          'View Result inspects persisted processing data. Import Knowledge Base creates vectors and writes Elasticsearch. Update Knowledge Base replaces the indexed version with current data. Retry reruns a failed task. Deleting a task clears related results according to backend lifecycle rules.',
        helpNotes:
          'Editing a chunk, summary, tag, or QA does not regenerate related fields or recalculate the stored quality score. After changing content, also review its summary and QA. After changing access tags, test retrieval with different users. Import is disabled while edits are unsaved.',
        manualEditWarning:
          'Saving updates only this chunk content, summary, tags, and QA. It does not recalculate quality or regenerate related fields; review them together.',
        fileName: 'File Name',
        status: 'Status',
        totalChunks: 'Total Chunks',
        tokenCost: 'Token Cost',
        createdAt: 'Created At',
        progress: 'Progress',
        action: 'Actions',
        resultTitle: 'Process Result',
        search: 'Search',
        reset: 'Reset',
        pending: 'Pending',
        processing: 'Processing',
        indexing: 'Indexing',
        done: 'Done',
        failed: 'Failed',
        queueAhead: 'Queued, {n} tasks ahead',
        statsChunks: 'chunks',
        statsParent: 'Parent',
        statsChild: 'Child',
        statsQa: 'QA',
        sectionCoverage: 'Section QA Coverage',
        averageQuality: 'Average Quality',
        qualityScore: 'Quality',
        llmCalls: 'LLM Calls',
        durationLabel: 'Duration',
        indexStatus: 'Knowledge Base',
        indexed: 'Indexed',
        notIndexed: 'Not Indexed',
        embeddingModel: 'Embedding Model',
        parent: 'Parent',
        child: 'Child',
        noTitle: 'No Title',
        childBlock: 'Child Block',
        parentBlock: 'Parent Block',
        tabContent: 'Content',
        tabSummary: 'Summary',
        tabTags: 'Tags',
        tabQa: 'QA',
        standardTags: 'Standard Tags',
        year: 'Year',
        docType: 'Doc Type',
        department: 'Department',
        post: 'Post',
        securityAndPermission: 'Security & Permission',
        securityLevel: 'Security Level',
        allowDepartment: 'Allowed Dept',
        allowPost: 'Allowed Post',
        allowUsers: 'Allowed Users',
        keywords: 'Keywords',
        customTags: 'Custom Tags',
        add: 'Add',
        delete: 'Delete',
        publicAccess: 'Public',
        deptOnly: 'Dept Only',
        postOnly: 'Post Only',
        userOnly: 'User Only',
        prev: 'Prev',
        next: 'Next',
        saveEdit: 'Save Current Edit',
        editChunk: 'Edit Current Chunk',
        importKb: 'Import to KB',
        updateKb: 'Update KB',
        close: 'Close',
        result: 'Result',
        retry: 'Retry',
        batchImport: 'Batch Import',
        confirmImport: 'Confirm import to knowledge base?',
        importConfirm: 'Import Confirm',
        importSuccess: 'Import successful',
        importFailed: 'Import failed',
        confirmDelete:
          'Delete this processing record? Its knowledge-base data and processing results will also be removed, and the parse record will return to Not Processed.',
        deleteConfirm: 'Delete Confirm',
        deleteSuccess: 'Deleted successfully',
        deleteFailed: 'Delete failed',
        selectRecords: 'Please select records',
        batchImportConfirm: 'Confirm import {n} records?',
        batchImportTitle: 'Batch Import',
        batchImportDone: 'Batch import completed',
        saveSuccess: 'Saved successfully',
        saveFailed: 'Save failed',
        reprocessConfirm: 'Re-process Confirm',
        chunkSearch: 'Search chunk',
        addQuestion: '+ Add question',
        selectOrCreate: 'Select or type',
        searchDept: 'Search department',
        searchPost: 'Search post',
        searchUser: 'Search user',
        requiredSelect: 'Required',
        addKeyword: 'Add keyword',
        tagKey: 'Key',
        tagValue: 'Value',
        selectChunkHint: 'Please select a chunk from the left to start editing',
        noQuestions: 'This chunk has no QA questions',
        authorizedSubjects: 'Authorized Scope',
        unsavedTitle: 'Unsaved Changes',
        unsavedMessage: 'The current chunk has unsaved changes. Discard them?',
        discardChanges: 'Discard Changes',
        charCount: 'chars',
        inheritedTitle: 'Inherited from Document (Read-Only)',
        inheritableYear: 'Year',
        inheritableDocType: 'Doc Type',
        inheritableDept: 'Department',
        inheritablePost: 'Position',
        inheritableSecurityTitle: 'Security & Permissions (Inherited)',
        inheritableSecurityLevel: 'Security Level',
        inheritableKeywords: 'Keywords',
        uploadSecurityLevel: 'Security Level',
        uploadYear: 'Year',
        uploadDocType: 'Doc Type',
        uploadDocTypeHint: 'policy/notice/report',
        uploadDept: 'Department',
        uploadPost: 'Position',
        uploadAclMode: 'Access Mode',
        uploadAclDept: 'Departments',
        uploadAclPost: 'Positions',
        uploadAclUser: 'Users',
        selectAclSubject: 'Select at least one authorized subject',
        aclUpdated: 'Access updated. Re-import previously indexed documents from Data Processing.',
        confirmAclSave: 'Confirm save ACL changes?',
        statsTotal: 'Total',
        stepProgress: 'Step {current}/{total}',
        step: {
          chunking: 'Text Split',
          labeling: 'Label Extraction',
          save: 'Data Saving',
          summarizing: 'Summary Generation',
          qa: 'QA Generation'
        },
        duration: {
          seconds: 's',
          minutes: 'min',
          hours: 'h'
        }
      },
      file: {
        upload: 'Upload File',
        batchParse: 'Batch Parse',
        parse: 'Parse',
        reparse: 'Re-parse',
        download: 'Download',
        delete: 'Delete',
        batchName: 'Batch Name:',
        dropHint: 'Drag files here or click to select',
        fileName: 'File Name',
        fileSize: 'Size',
        status: 'Status',
        action: 'Actions',
        selectFile: 'Please select files',
        uploadDone: 'Upload completed',
        confirmDelete: 'Confirm delete this file?',
        deleteConfirm: 'Delete Confirm',
        reparseConfirm: 'Re-parse Confirm',
        parseConfirm: 'Confirm to parse "{name}"?',
        batchParseConfirm: 'Confirm to parse {count} files?',
        confirmReparse: 'Confirm Re-parse',
        reparseConfirmMsg:
          'File "{name}" has already been parsed. Re-parsing will clear existing results and downstream data.\n\nContinue?',
        uploaded: 'Not Parsed',
        parsing: 'Parsing',
        parsed: 'Parsed',
        parseFailed: 'Parse Failed',
        waitUpload: 'Waiting',
        uploading: 'Uploading',
        uploadComplete: 'Done',
        startUpload: 'Start upload',
        uploadFailed: 'Failed',
        remove: 'Remove',
        cancel: 'Cancel',
        confirmUpload: 'Confirm upload selected files?',
        batchParseCount: 'Batch Parse({n})',
        batchParseTitle: 'Batch Parse Confirm',
        batchParseConfirmBtn: 'Confirm All',
        batchParseCancelBtn: 'Cancel',
        batchParseSubmitted: 'Batch parse task submitted',
        fileSelectHint: 'Please select files first',
        submitFailed: 'Submission failed, please try again',
        reparseConfirmHint: 'Please re-confirm and try again',
        batchParseUploaded: '(Not parsed)',
        batchParseParsed: '(Already parsed)',
        batchParseDirect: 'The following {n} files can be parsed directly:',
        batchParseNeedConfirm: 'The following {n} files have been parsed before, re-parsing will clear results:',
        batchParseContinue: 'Continue with all parsing?',
        batchParseSubmitConfirm: 'Batch Parse Confirm',
        batchParseSubmitConfirmBtn: 'Confirm All',
        batchParseSubmitCancelBtn: 'Cancel',
        batchParseSubmitSuccess: 'Batch parse task submitted',
        batchParseSubmitFailed: 'Submission failed, please try again',
        batchParseReparseConfirm: 'Re-parse Confirm',
        batchParseReparseConfirmBtn: 'Confirm Re-parse',
        batchParseReparseCancelBtn: 'Cancel',
        batchParseReparseSuccess: 'Parse task submitted',
        batchNameHint: 'Optional, for batch tracking',
        supportedFormats: 'Supports PDF/DOCX/XLSX/PPTX/TXT/MD/HTML/CSV/JPG/PNG/GIF/BMP/TIFF/WEBP, max 50MB'
      },
      kb: {
        title: 'Knowledge Base',
        totalCount: 'Total Chunks',
        search: 'Search',
        reset: 'Reset',
        viewDetail: 'View Detail',
        delete: 'Delete',
        batchDelete: 'Batch Delete',
        refresh: 'Refresh',
        department: 'Department',
        securityLevel: 'Security Level',
        year: 'Year',
        fileName: 'File',
        tags: 'Tags',
        summary: 'Summary',
        action: 'Actions',
        detail: 'Chunk Detail',
        source: 'Source',
        content: 'Content',
        questions: 'Assumed Questions',
        keywordSearch: 'Keyword Search',
        public: 'Public',
        confirmDelete: 'Confirm delete?',
        deleteConfirm: 'Delete Confirm',
        batchDeleteConfirm: 'Batch Delete',
        selectFirst: 'Please select first',
        unindex: 'Remove from Knowledge Base',
        unindexConfirm: 'Remove from Knowledge Base',
        unindexConfirmMessage:
          'Remove "{name}" from the knowledge base? Only its ES retrieval data will be deleted. The file, parse record, and processing results will be retained and can be imported again.',
        unindexSuccess: 'Removed from knowledge base'
      }
    }
  },
  form: {
    required: 'Cannot be empty',
    userName: {
      required: 'Please enter user name',
      invalid: 'User name format is incorrect'
    },
    phone: {
      required: 'Please enter phone number',
      invalid: 'Phone number format is incorrect'
    },
    pwd: {
      required: 'Please enter password',
      invalid: 'Use 6-18 characters with at least one letter, number, and special character'
    },
    confirmPwd: {
      required: 'Please enter password again',
      invalid: 'The two passwords are inconsistent'
    },
    code: {
      required: 'Please enter verification code',
      invalid: 'Verification code format is incorrect'
    },
    email: {
      required: 'Please enter email',
      invalid: 'Email format is incorrect'
    }
  },
  dropdown: {
    closeCurrent: 'Close Current',
    closeOther: 'Close Other',
    closeLeft: 'Close Left',
    closeRight: 'Close Right',
    closeAll: 'Close All'
  },
  icon: {
    themeConfig: 'Theme Configuration',
    themeSchema: 'Theme Schema',
    lang: 'Switch Language',
    fullscreen: 'Fullscreen',
    fullscreenExit: 'Exit Fullscreen',
    reload: 'Reload Page',
    collapse: 'Collapse Menu',
    expand: 'Expand Menu',
    pin: 'Pin',
    unpin: 'Unpin'
  },
  datatable: {
    itemCount: 'Total {total} items'
  },
  rag: {
    responseRule: 'Success Response Rule',
    enums: {
      public: 'Public',
      department: 'Authorized Department',
      post: 'Authorized Post',
      user: 'Authorized User',
      authNone: 'None',
      authApiKey: 'API Key',
      authBearer: 'Bearer Token',
      authBasic: 'Basic Auth',
      authHmac: 'AK/SK Signature',
      apiCall: 'API Call',
      sqlExec: 'SQL Execution',
      pending: 'Pending',
      riskLow: 'Low',
      riskMedium: 'Medium',
      riskHigh: 'High',
      failed: 'Failed'
    },
    common: {
      search: 'Search',
      create: 'Create',
      edit: 'Edit',
      delete: 'Delete',
      save: 'Save',
      cancel: 'Cancel',
      detail: 'Detail',
      export: 'Export',
      copy: 'Copy',
      copySuccess: 'Copied',
      status: 'Status',
      action: 'Action',
      keywordPlaceholder: 'Enter keywords',
      startDate: 'Start date',
      endDate: 'End date',
      requiredFields: 'Complete the required fields',
      invalidJson: '{field} is not valid JSON'
    },
    chat: {
      newSession: 'New Chat',
      noSession: 'No Sessions',
      selectSession: 'Select or create a session',
      inputPlaceholder: 'Type your question... (Enter to send, Shift+Enter for new line)',
      send: 'Send',
      stop: 'Stop',
      generationStopped: 'Response stopped',
      generationStoppedPartial: 'Generation stopped; the content above was received before stopping',
      noMessages: 'Send a message to start',
      scope: 'Knowledge Base Scope',
      statusAnalyzing: 'Analyzing the question...',
      messageCount: '{count} messages',
      source: 'Source',
      chunk: 'Chunk',
      evidence: 'Evidence',
      like: 'Like',
      dislike: 'Dislike',
      copyAnswer: 'Copy answer',
      answerMode: 'Answer mode',
      modeAuto: 'Smart mode',
      modeKnowledge: 'Knowledge only',
      modeGeneral: 'General chat',
      modeHint: {
        auto: 'Automatically chooses knowledge or general chat; attachments stay grounded',
        knowledge: 'Uses only knowledge sources and attachments; it will not invent missing facts',
        general:
          'Uses public model knowledge and session attachments without querying the system knowledge base or representing internal policy'
      },
      answerGenerally: 'Answer from general knowledge',
      rephrase: 'Rephrase question',
      feedbackTitle: 'Answer feedback',
      feedbackType: 'Select a feedback type',
      feedbackTypeRequired: 'Select a feedback type',
      feedbackReasonOptional: 'Additional details (optional)',
      feedbackPlaceholder: 'Optionally describe what was inaccurate or did not meet expectations.',
      submitFeedback: 'Submit feedback',
      feedbackSubmitted: 'Feedback submitted',
      feedbackTypes: {
        factualMismatch: 'Conflicts with facts',
        instructionNotFollowed: 'Did not follow instructions',
        formatIssue: 'Incorrect format',
        contentError: 'Content error',
        incompleteAnswer: 'Incomplete answer',
        irrelevantAnswer: 'Irrelevant answer',
        other: 'Other issue'
      },
      attachments: 'Session attachments',
      expandAttachments: 'Expand attachment list',
      collapseAttachments: 'Collapse attachment list',
      attachmentSummaryReady: '{count} ready',
      attachmentSummaryProcessing: '{count} processing',
      attachmentSummaryFailed: '{count} failed',
      attachmentQuality: 'Quality {score}',
      unknownFormat: 'Unknown format',
      addAttachment: 'Add session attachment',
      removeAttachment: 'Remove attachment',
      retryAttachment: 'Retry processing',
      attachmentUploadFailed: 'Attachment upload failed',
      waitForAttachments: 'Wait for attachments to finish processing before sending',
      attachmentStatus: {
        uploaded: 'Uploaded',
        parsing: 'Parsing',
        processing: 'Processing',
        ready: 'Ready',
        failed: 'Failed'
      }
    },
    help: {
      description: 'Purpose and Behavior',
      steps: 'Configuration Steps',
      stepTypes: 'Step Type Configuration Guide',
      parameters: 'All Parameters',
      required: 'Required',
      optional: 'Optional',
      exampleValue: 'Example',
      howToConfigure: 'How to Configure',
      stepOutput: 'Step Output',
      exampleConfig: 'Configuration Example',
      rules: 'Field Rules',
      examples: 'Complete Example',
      effects: 'Effect After Saving',
      notes: 'Security and Common Issues'
    },
    editor: {
      format: 'Format',
      useExample: 'Use Example',
      jsonHint: 'JSON syntax highlighting, bracket matching, live validation, and error-line location are enabled.',
      yamlHint:
        'YAML syntax highlighting, live parsing, and error-line location are enabled. Apply changes to the form before saving.',
      arrayRequired: 'The root must be a JSON array, for example [].',
      objectRequired: 'The root must be a JSON object, for example {}.',
      invalidContent: 'The configuration format is invalid',
      errorDetail: 'Line {line}, column {column}: {message}'
    },
    skill: {
      emptyHint:
        'No Skills yet. Configure a data source, Schema, or API tool first, then create and trial-run a business Skill.',
      name: 'Name',
      code: 'Code',
      triggerKeywords: 'Trigger Words',
      intentType: 'Intent Type',
      positiveExamples: 'Positive Examples',
      negativeExamples: 'Exclusion Examples',
      version: 'Version',
      minScore: 'Min Score',
      yamlPreview: 'YAML Preview',
      yamlConfig: 'YAML Expert Mode',
      basicInfo: 'Basic Information',
      createTitle: 'Create Skill',
      editTitle: 'Edit Skill',
      validate: 'Validate',
      validateSuccess: 'Validation passed',
      addStep: 'Add Step',
      stepEdit: 'Step Editor',
      stepDescription: 'Step Description',
      type: 'Type',
      dependsOn: 'Dependencies',
      steps: 'Execution Steps',
      namePlaceholder: 'Enter a recognizable Skill name',
      codePlaceholder: 'Enter a unique code, e.g. order_query',
      descriptionPlaceholder: 'Describe applicable scenarios and capability boundaries',
      triggerPlaceholder: 'Separate multiple trigger words with commas',
      intentTypeHint:
        'Knowledge Skills answer from evidence. Action and composite Skills may take priority for execution. Legacy Skills are inferred from their steps.',
      positiveExamplesPlaceholder: 'One typical request that should match per line',
      negativeExamplesPlaceholder: 'One similar request that must not run this Skill per line',
      yamlPlaceholder: 'Enter the complete YAML configuration',
      requiredFields: 'Name and code are required',
      deleteConfirm:
        'Permanently delete this Skill configuration? It cannot be restored, while historical runs remain. Confirm no automation workflow references it before continuing.',
      intentTypes: {
        knowledge: 'Knowledge Answer',
        action: 'Data Query or Tool Action',
        composite: 'Multi-step Composite Task'
      },
      stepsHint: 'Steps without dependencies run in parallel; dependent steps wait for all upstream steps.',
      noSteps: 'No execution steps',
      stepNumber: 'Step {number}',
      stepId: 'Step ID',
      stepIdPlaceholder: 'e.g. query_members',
      stepDescriptionPlaceholder: 'Describe what this step should accomplish',
      dependsPlaceholder: 'Select upstream steps to wait for',
      moveUp: 'Move up',
      moveDown: 'Move down',
      ragQuery: 'Retrieval Query',
      ragQueryPlaceholder: 'Leave blank to use the user request, or enter a fixed query',
      datasource: 'Data Source',
      datasourcePlaceholder: 'Select an enabled data source',
      queryHint: 'Query Intent',
      queryHintPlaceholder: 'Describe the required data and filters in natural language',
      apiTool: 'API Tool',
      apiToolPlaceholder: 'Select an enabled API tool',
      builtinTool: 'Built-in Tool',
      builtinPlaceholder: 'Select a platform built-in tool',
      parameters: 'Request Parameters',
      arguments: 'Tool Arguments',
      paramName: 'Parameter name',
      paramValue: 'Fixed value or upstream step field reference',
      addParameter: 'Add Parameter',
      paramLiteral: 'Literal',
      paramBinding: 'Upstream binding',
      paramLiteralPlaceholder: 'Enter a string or JSON value',
      bindingSource: 'Source step',
      bindingPath: 'JSONPath, for example $[0].id',
      cardinalityOne: 'Single value (one)',
      cardinalityMany: 'Collection (many)',
      onEmptyFail: 'Fail when empty',
      onEmptySkip: 'Omit when empty',
      onEmptyDefault: 'Use default when empty',
      onMultipleFail: 'Fail on multiple values',
      onMultipleFirst: 'Use first value',
      overflowFail: 'Fail on overflow',
      overflowTruncate: 'Truncate on overflow',
      defaultValue: 'Default string or JSON value',
      promptTemplate: 'Prompt Template',
      promptPlaceholder: 'Describe how upstream outputs should be combined',
      insertOutput: 'Insert upstream output:',
      temperature: 'Temperature',
      foreachConfig: 'Batch Loop Configuration',
      transformConfig: 'Deterministic Transform Configuration',
      outputSchema: 'Output Schema',
      outputSchemaHint:
        'Optional. When configured, successful primary data must satisfy this JSON Schema or the step fails. An LLM must then return valid JSON.',
      outputSchemaHelp:
        'Declare the JSON Schema contract for step primary data. RAG, NL2SQL, API, built-in, and LLM steps validate it at the success boundary. For LLM, configuring a Schema parses the response as structured JSON instead of plain text. Configure output_schema inside the advanced JSON for Transform and foreach.',
      stepsRequired: 'Add at least one execution step',
      stepIdRequired: 'Step ID is required',
      stepIdDuplicate: 'Step IDs must be unique',
      selfDependency: 'A step cannot depend on itself',
      missingDependency: 'A dependency is no longer available; select the dependencies again',
      dependencyCycle: 'Step dependencies cannot form a cycle',
      datasourceRequired: 'An NL2SQL step requires a data source',
      toolRequired: 'A tool step requires a tool',
      promptRequired: 'An LLM step requires a prompt template',
      parameterKeyDuplicate: 'Parameter names must be unique within a step',
      outputSchemaInvalid: 'Output Schema must be a valid JSON object',
      foreachJsonInvalid: 'Batch loop configuration is not valid JSON',
      transformJsonInvalid: 'Transform configuration is not valid JSON',
      transformInputRequired: 'A transform requires input or inputs',
      transformOperationsRequired: 'A transform requires an operations array',
      yamlApplied: 'YAML applied to the form',
      yamlExpertHint:
        'Expert-mode changes are not saved directly. Apply them to the form first; invalid YAML never overwrites the form.',
      applyYaml: 'Apply to Form',
      regenerateYaml: 'Regenerate from Form',
      firstUseGuide:
        'Recommended first setup flow: 1. Configure a data source/Schema or tool. 2. Verify it with Test. 3. Create a Skill from a template. 4. Trial-run the execution chain. 5. Validate it in Chat.',
      quickDatasource: 'Data Source',
      quickTool: 'Tool',
      quickChat: 'Chat Test',
      matchTest: 'Match Test',
      viewBadCase: 'View Bad Cases',
      runTest: 'Trial Run',
      runCurrentConfig: 'Trial Run Current Config',
      configTemplate: 'Template',
      templateRagName: 'Knowledge Base Q&A',
      templateRagDescription: 'Retrieve knowledge first, then generate an evidence-based answer',
      templateRagKeywords: 'policy, rule, procedure, how to',
      templateDataName: 'Data Query Q&A',
      templateDataDescription:
        'Convert a natural-language request to read-only SQL, then explain the result with an LLM',
      templateDataKeywords: 'statistics, query, count, ranking',
      templateToolName: 'Tool Query/Action',
      templateToolDescription: 'Call a configured external tool, then summarize its result',
      templateToolKeywords: 'process, query record, sync, create',
      templateBatchName: 'Batch Processing',
      templateBatchDescription: 'Query candidate data first, then run a tool step for each item',
      templateBatchKeywords: 'batch, bulk process, multiple records',
      applyTemplate: 'Apply Template',
      applyTemplateTitle: 'Apply Template',
      applyTemplateConfirm:
        'Applying a template replaces the current step configuration. The basic name and code are kept.',
      publishCheckTitle: 'Pre-publish Check',
      publishCheckHint: 'This configuration still has pre-publish warnings. They will be confirmed again when saving.',
      continueSave: 'Continue Saving',
      returnEdit: 'Return to Edit',
      testQuestion: 'Test Question',
      testQuestionPlaceholder: 'Enter a likely user question',
      runDialogTitle: 'Skill Execution Chain Trial Run',
      testTarget: 'Target',
      currentEditingConfig: 'Current Editing Config',
      runQuestionPlaceholder: 'Enter a question for the execution-chain trial run',
      executeActions: 'Execute Actions',
      dryRunActionHint: 'When disabled, action API steps are skipped in dry-run mode',
      runCompleted: 'Trial run completed',
      runCompletedDry: 'Trial run completed: action steps were skipped',
      startRun: 'Start Trial Run',
      startTest: 'Test',
      close: 'Close',
      stepColumn: 'Step',
      output: 'Output',
      noMatch: 'No enabled Skill matched',
      matchedResult: 'Matched {name} ({code}), score {score}, method: {source}',
      matchSourceRule: 'Rule match',
      matchSourceSemantic: 'Vector recall + LLM semantic rerank',
      matchSourceLlmFallback: 'LLM semantic match (vector fallback)',
      matchSourceUnknown: 'Compatibility mode',
      missingTriggerWarning:
        'No trigger words are configured. Semantic recall still works, but adding focused keywords improves explainability and reranking.',
      apiParamWarning:
        'An API step has no parameters. Confirm the tool needs no parameters or test it on the Tool page first.',
      nl2sqlDatasourceWarning: 'An NL2SQL step has no selected data source.',
      llmDependencyWarning: 'An LLM step has no upstream dependency. Confirm it is not isolated generation.',
      foreachWarning: 'A batch step exists. Trial-run max_items and failure handling first.',
      testQuestionRequired: 'Enter a test question',
      matchTestHint:
        'Tests saved enabled Skills using strong rules first, then vector recall over the name, description, triggers, and positive examples, followed by tenant-scoped LLM reranking. Exclusion examples always take priority.',
      runTestHint:
        'Query, retrieval, and model steps may execute for real. Action APIs never execute here: disabled means dry-run skip; enabled verifies that HITL blocks the action.',
      actionGateCheck: 'Check Action Approval Gate',
      actionGateCheckHint:
        'Verifies that HITL blocks Action steps. A standalone trial run has no chat session and never calls the endpoint.',
      typeColumn: 'Type',
      statusColumn: 'Status',
      outputTruncated: '...[output truncated]',
      types: {
        rag: 'Knowledge Retrieval',
        nl2sql: 'Data Query (NL2SQL)',
        api: 'API Tool',
        builtin: 'Built-in Tool',
        llm: 'LLM Synthesis',
        transform: 'Deterministic Transform',
        foreach: 'Batch Loop (Advanced)'
      },
      builtins: {
        currentDatetime: 'Current Date and Time',
        dateCalculate: 'Date Calculation',
        calculator: 'Calculator',
        unitConvert: 'Unit Conversion'
      },
      templateTransformName: 'Query, Transform, and Call',
      templateTransformDescription:
        'Query structured data, build a request through Transform, then explicitly bind it to an API; adapt fields and parameters to the actual tool',
      templateTransformKeywords: 'post-query processing, data transform, composed call, aggregate then act',
      insertTransformOperation: 'Insert operation example',
      transformOperations: {
        select: 'Select path',
        filter: 'Filter',
        project: 'Project fields',
        rename: 'Rename fields',
        distinct: 'Distinct',
        sort: 'Sort',
        slice: 'Slice',
        limit: 'Limit items',
        aggregate: 'Aggregate',
        object: 'Build object',
        merge: 'Merge objects',
        default: 'Default when empty',
        cast: 'Cast type'
      },
      templateContent: {
        retrieveKnowledge: 'Retrieve relevant knowledge',
        generateAnswer: 'Synthesize answer',
        ragPrompt:
          'Answer the current user question only from the retrieved knowledge.\nKnowledge: {output}\nRequirements: be clear and accurate; state explicitly when evidence is insufficient.',
        queryData: 'Query business data',
        queryDataHint:
          'Query only fields required by the current question, limit returned rows, and avoid sensitive fields.',
        summarizeData: 'Explain query result',
        dataPrompt:
          'Answer the current user question from the structured query result.\nQuery result: {output}\nExplain key figures, metric definitions, and limitations.',
        callTool: 'Call external tool',
        summarizeTool: 'Summarize tool result',
        toolPrompt: 'Turn the structured tool result into a user-readable conclusion.\nTool result: {output}',
        queryRecords: 'Query records for transformation',
        queryRecordsHint: 'Return stable IDs, amounts, and every field required to build the downstream request.',
        buildRequest: 'Build request deterministically',
        callAction: 'Call configured tool',
        summarizeAction: 'Summarize call result',
        actionPrompt:
          'Explain execution status, affected objects, and failures from the structured tool result.\nTool result: {output}',
        queryItems: 'Query items to process',
        queryItemsHint: 'Query records to process and include each record id and display name.',
        processItems: 'Run tool for each item',
        summarizeBatch: 'Summarize batch result',
        batchPrompt:
          'Summarize successful and failed items and anything requiring confirmation.\nBatch result: {output}'
      },
      help: {
        transformTitle: 'Deterministic Transform',
        transformDescription:
          'Use restricted declarative operations for selection, filtering, projection, renaming, deduplication, sorting, slicing, aggregation, object assembly, and merging. Inputs are limited to 200 items; scripts, network, and file access are unavailable.',
        fields: {
          name: 'Enter a business-facing name used in lists, selectors, and execution results; it should state the task this Skill performs.',
          code: 'Enter a tenant-unique stable code using letters, digits, and underscores. Do not casually rename it after other configurations reference it.',
          description:
            'Describe scenarios, required input, primary output, and boundaries. It may be blank, but missing semantics makes Agent selection unreliable.',
          intentType:
            'Knowledge is evidence-oriented. Action and composite mark operational capabilities for routing. This affects priority but does not create steps.',
          triggerKeywords:
            'Enter intent phrases separated by commas. At least one trigger must match before the Chat semantic fallback considers this Skill; avoid broad words.',
          positiveExamples:
            'Enter one complete expected request per line. Substring rule matching raises the score to 1.0; do not use a single broad word.',
          negativeExamples:
            'Enter one similar request that must not run the Skill per line. A substring match sets the rule score to 0 and takes precedence.',
          minScore:
            'Set the rule threshold from 0.50 to 1.00 in 0.05 steps. Higher values reduce false triggers but may miss vague requests; start at 0.65.',
          status:
            'Only enabled Skills can be selected by the Agent. Disabling retains configuration and execution history.',
          stepId:
            'Enter a unique step identifier beginning with a letter and containing at most 64 letters, digits, or underscores; dependencies and output references use it.',
          type: 'Choose knowledge retrieval, data query, API, built-in, LLM, deterministic transform, or batch-loop execution. The type determines the required settings below.',
          stepDescription:
            'State the result and success criteria for this step. NL2SQL uses it as the query hint when no explicit query hint is provided.',
          dependsOn:
            'Select upstream steps that must all finish successfully first. Steps without dependencies may run in parallel.',
          ragQuery:
            'Enter fixed retrieval text or leave blank to use the current user question. It may also reference the complete output of a declared dependency using a step_id wrapped in double braces.',
          datasource:
            'Select an enabled tenant data source. Runtime still filters available tables and columns by the current user Schema ACL.',
          queryHint:
            'Describe the entity, filters, time range, metric definitions, and returned columns. The executor does not automatically append the original user question.',
          apiTool:
            'Select an enabled authorized tenant tool. Its parameter Schema, ACL, authentication, and Query/Action classification remain enforced.',
          parameters:
            'Enter literals directly. For upstream values, explicitly select source, JSONPath, one/many cardinality, and empty, multiple, and overflow policies. Runtime never guesses a field or silently takes the first row.',
          builtinTool:
            'The normal form supports current_datetime, date_calculate, calculator, and unit_convert. Expert YAML also supports Tavily-backed web_search, which cannot run in foreach.',
          arguments:
            'Enter values according to the built-in contract. Full upstream references are supported; dates, zones, units, and web-search parameters must use valid formats.',
          promptTemplate:
            'Specify task, evidence, output format, and missing-data behavior. Complete outputs, field paths, and read-only #each loops are supported; every source must be a dependency.',
          temperature:
            'Set LLM randomness from 0 to 1. Use 0 to 0.3 for extraction and action parameters, and 0.3 to 0.7 for ordinary summaries.',
          outputSchema:
            'Optionally declare a JSON Schema for RAG, NL2SQL, API, built-in, or LLM steps. Successful data must satisfy it or the step fails and downstream execution stops. LLM output is parsed as structured JSON instead of plain text. Configure output_schema inside advanced JSON for Transform and batch loops.',
          foreachConfig:
            'Configure source array, optional path, item limit, retries, failure policy, and body. Maximum 200 items; body supports API or ordinary built-ins, not web_search.',
          transformInputs:
            'Use input or inputs to bind structured upstream primary data. Each binding declares source, restricted JSONPath, one/many cardinality, and failure policies; add every source as a dependency.',
          transformOperations:
            'Configure at most 20 operations: select, filter, project, rename, distinct, sort, slice, limit, aggregate, object, merge, default, and cast. Intermediate values are size-limited.',
          transformOutputSchema:
            'Validate final JSON with JSON Schema. For action APIs, money, counts, or IDs, declare types, required fields, array items, and necessary constraints; validation failure stops downstream execution.',
          yamlConfig:
            'Expert representation of the complete Skill for review, migration, and bulk editing. Apply it to the form and pass validation before saving.'
        },
        fieldExamples: {
          name: 'Bulk Member Coupon Grant',
          positiveExamples: 'Issue this month coupon to eligible members',
          positiveExamplesMultiline:
            'Check whether this order is eligible for a refund\nReview the order and create a refund request\nThis order has a quality issue; start the refund process',
          negativeExamples: 'Explain the coupon policy only; do not issue anything',
          negativeExamplesMultiline:
            'Explain the refund policy only; do not query my order\nCheck the delivery status\nI need to change the shipping address, not request a refund',
          stepDescription: 'Find an active no-threshold coupon worth 100 yuan',
          ragQuery: 'Coupon eligibility, restrictions, and approval rules',
          queryHint: 'Find active 100-yuan no-threshold coupons and return coupon ID, name, and validity period'
        },
        title: 'Skill Configuration Help',
        description:
          'A Skill is a controlled DAG. Intent type guides chat routing while seven step types define execution. Deterministic mapping, filtering, and aggregation belong in Transform. Use YAML Expert Mode only to inspect or migrate the full definition.',
        example: 'NL2SQL query → Transform and validation → explicit API binding → chat HITL → LLM summary',
        note1:
          'A Skill can only reference enabled data sources, Schemas, and API tools available to the current tenant and user.',
        note2:
          'Chat Action APIs force HITL, while standalone trial runs only verify the gate. Automation Skill nodes currently reject API steps; use workflow API nodes and explicit approval.',
        note3:
          'A successful save only proves structural validity. Before enabling, test realistic requests with missing details, synonyms, and multi-turn additions.',
        step1: 'Enter a name, stable code, capability description, and the intent type matching the real task.',
        step2:
          'Add specific triggers, positive examples, exclusion examples, and a minimum confidence from 0.50 to 1.00.',
        step3:
          'Split the workflow by outputs. Give every step a unique ID, type, and clear objective; independent steps may run in parallel.',
        step4:
          'Select every source dependency. Use explicit bindings for simple API parameters and Transform for filtering, aggregation, renaming, and request assembly.',
        step5:
          'In Chat Skills, place Action tools after query and validation. In Automation, replace any API-containing Skill with explicit workflow API nodes.',
        step6:
          'Trial-run outputs and the HITL gate, inspect YAML, apply edits to the form, validate, save, and finish with realistic multi-turn Chat testing.',
        rule1:
          'Step IDs are unique within the Skill and use letters, numbers, and underscores. Do not rename IDs already referenced downstream.',
        rule2:
          'Dependencies must form a directed acyclic graph. Independent steps run in parallel; dependent steps wait for every upstream result.',
        rule3: 'Fixed values and upstream fields in parameter mappings must match the target tool parameter Schema.',
        rule4:
          'Batch loops require a source array, body, and maximum count. The body supports API or ordinary built-ins, never web_search.',
        rule5:
          'Transform allows at most 20 operations, 200 items, 1 MB JSON, and 32 nesting levels. Only restricted JSONPath and declarative operations are available.',
        effect1:
          'When enabled, the Agent evaluates intent type, examples, triggers, rule score, and any eligible semantic fallback before selection.',
        effect2:
          'Execution inherits tenant, user, and session permissions; downstream steps only receive data and tools authorized for that user.',
        ragGuideTitle: 'Knowledge Retrieval (RAG)',
        ragGuidePurpose:
          'Retrieves evidence from tenant knowledge and session attachments visible to the current user. Use it for policies, manuals, instructions, and attachment content.',
        ragGuideField1:
          'Step ID: use a stable descriptive ID such as retrieve_policy so downstream LLM steps can reference the evidence.',
        ragGuideField2:
          'Dependencies: usually none, so it can run beside data queries. When the retrieval query references an upstream step, add that step as a dependency.',
        ragGuideField3:
          'Retrieval Query: leave blank to use the current user request. Fixed text may include a complete upstream output using a step_id wrapped in double braces; unresolved references fail explicitly.',
        ragGuideOutput:
          'Returns evidence with file name, section, chunk marker, and content, retaining citation data for the final answer.',
        nl2sqlGuideTitle: 'Data Query (NL2SQL)',
        nl2sqlGuidePurpose:
          'Generates and executes read-only SQL within authorized Schemas of the selected data source for filtering, statistics, and aggregation.',
        nl2sqlGuideField1:
          'Data Source: select an enabled tenant source. Available tables and fields are still filtered by the current user’s Schema ACL.',
        nl2sqlGuideField2:
          'Query Intent: state the data object, filters, calculation convention, time range, and required output fields. The executor uses this text directly and does not append the current user request or interpolate upstream values.',
        nl2sqlGuideField3:
          'Dependencies: fixed queries usually need none. For dynamic conditions, reference a declared dependency through its complete output or field path; resolved text still passes Schema ACL and read-only SQL checks.',
        nl2sqlGuideOutput:
          'The primary output is an array of up to 50 row objects with SQL and row-count metadata. Markdown is generated only at the presentation boundary.',
        apiGuideTitle: 'API Tool',
        apiGuidePurpose:
          'Calls an enabled and authorized tenant HTTP tool for either read-only queries or HITL-gated business actions.',
        apiGuideField1:
          'API Tool: select an enabled tool. The Skill supplies logical parameters; the tool routes them to query, path, body, or header from x-in/in and x-http-name/httpName in its parameter Schema while retaining legacy URL placeholders.',
        apiGuideField2:
          'Dependencies: every binding source must also be declared as a dependency. Without dependencies, only literal values are allowed.',
        apiGuideField3:
          'Request Parameters: choose Literal or Upstream Binding. A binding declares source, safe JSONPath, one/many cardinality, and empty/multiple policies.',
        apiGuideField4:
          'Collection bindings require many and a limit up to 200. Use transform first for filtering, aggregation, renaming, or request assembly.',
        apiGuideOutput:
          'Query tools return structured mapped results. Action tools freeze params, URL, body, and hash before HITL and execute only that frozen request.',
        builtinGuideTitle: 'Built-in Tool',
        builtinGuidePurpose:
          'Runs deterministic date, calculation, and conversion capabilities; expert YAML also supports Tavily-backed web search.',
        builtinGuideField1:
          'The normal form offers current_datetime, date_calculate, calculator, and unit_convert; expert YAML also accepts web_search.',
        builtinGuideField2:
          'Follow each contract. web_search accepts query, topic, search_depth, max_results, and time_range and fails when Tavily is unavailable.',
        builtinGuideField3:
          'Values may be fixed or upstream references. web_search cannot run inside foreach and should be followed by an LLM that preserves source links.',
        builtinGuideOutput:
          'Returns date, calculation, conversion, or web-search structured data, with a specific error for invalid input or unavailable services.',
        llmGuideTitle: 'LLM Synthesis',
        llmGuidePurpose:
          'Organizes upstream outputs into user-readable content. Deterministic mapping, filtering, and aggregation belong in Transform.',
        llmGuideField1:
          'Dependencies: select every step referenced by the Prompt. Missing dependencies can make the LLM run too early.',
        llmGuideField2:
          "Prompt supports complete outputs, field paths, and read-only #each/this/{'@'}index array loops. Nested loops are unsupported, and the current user request is appended.",
        llmGuideField3:
          'Specify objective, evidence, output format, and missing-data behavior. Do not ask the LLM to guess fields, calculate money, filter, or aggregate.',
        llmGuideField4: 'Temperature: use 0–0.3 for factual extraction and 0.3–0.7 for ordinary synthesis.',
        llmGuideOutput:
          'Returns generated text or JSON conforming to output_schema. A final LLM step becomes the primary response.',
        transformGuideTitle: 'Deterministic Transform',
        transformGuidePurpose:
          'Resolves mismatched JSON contracts through auditable mapping, filtering, aggregation, and request assembly without an LLM or scripts.',
        transformGuideField1:
          'inputs/input: name each input and explicitly set source, restricted JSONPath, one/many, on_empty, on_multiple, max_items, and overflow. Add every source to Dependencies.',
        transformGuideField2:
          'operations: select, filter, project, rename, distinct, sort, slice, limit, aggregate, object, merge, default, and cast, with at most 20 operations. limit accepts limit or count.',
        transformGuideField3:
          'filter supports equals, not_equals, in, contains, exists, gt, gte, lt, and lte. aggregate supports count, sum, avg, min, and max. sort direction is asc or desc.',
        transformGuideField4:
          'Paths allow only $, dotted fields, numeric indexes, and array wildcards. Filters, functions, recursive paths, and scripts are unavailable.',
        transformGuideField5:
          'output_schema validates final output. Runtime limits are 200 items, 1 MB JSON, and 32 nesting levels; any failure stops downstream execution.',
        transformGuideField6:
          'Trial Run may execute query and model steps for real. Action APIs are either dry-run skipped or blocked by HITL gate verification.',
        transformGuideOutput:
          'Returns object, array, or scalar structured data with operation and row metadata for explicit downstream bindings.',
        foreachGuideTitle: 'Batch Loop (Advanced)',
        foreachGuidePurpose:
          'Repeats one API or built-in tool for every item in an upstream array when no batch endpoint is available. This type currently uses JSON configuration.',
        foreachGuideField1:
          'items: place the upstream step ID in double braces. The step must return a JSON array or an object containing an array and must be selected as a dependency.',
        foreachGuideField2:
          'item_path: optional path to the array, such as data.records. It may be omitted for a single array field or common keys such as records, rows, or list.',
        foreachGuideField3:
          'max_items: requested cap, never above the system maximum of 200. max_attempts is 1–3, but non-idempotent Action APIs are not automatically retried.',
        foreachGuideField4:
          'continue_on_error: true continues after an item failure and reports partial failure; false stops at the first failed item.',
        foreachGuideField5:
          'body: only api or builtin. In double braces, item means the whole item, item.id a field, and index the zero-based position. An Action API receives one HITL approval for the whole batch.',
        foreachGuideOutput:
          'Returns structured JSON with total, processed, succeeded, failed, retryable, and per-item results for summarization and partial-failure recovery.',
        descriptionTitle: 'Capability Description',
        descriptionField:
          'Describe the goal, input, output, and boundaries. It may be blank, but missing semantics makes selection less reliable; never claim unconfigured capabilities.',
        descriptionExample:
          'Query business records visible to the user and combine them with knowledge-base rules; never modifies business data.',
        triggerTitle: 'Trigger Words',
        triggerDescription:
          'Enter typical intent phrases separated by commas. Triggers also gate semantic fallback candidates, so cover synonyms but avoid broad phrases.',
        triggerExample: 'business record analysis, policy validation, generate operational recommendations',
        scoreTitle: 'Minimum Confidence',
        scoreDescription:
          'The UI range is 0.50–1.00 in 0.05 steps. Higher values reduce false matches but may miss vague requests; start near 0.65. Match Test checks rules only.',
        stepIdTitle: 'Step ID',
        stepIdDescription:
          'A stable unique identifier used by dependencies, parameter references, and execution logs. Prefer an action_object format such as query_records and use only letters, numbers, and underscores.',
        dependsTitle: 'Dependencies',
        dependsDescription:
          'The step waits until every selected upstream step succeeds and may reference their outputs. Without dependencies it can run in parallel; set dependencies explicitly whenever order changes the result.',
        dependsExample: '“Generate conclusion” depends on “Retrieve policy” and “Query records”',
        paramsTitle: 'Parameter Mapping',
        paramsDescription:
          'Use a literal or bind an upstream value with source, safe JSONPath, one/many cardinality, and failure policies. Parameter names must match the API Tool Schema; the Tool decides whether each value is sent in query, path, body, or header.',
        paramsExample: 'recordId binds query_record $[0].id; recordIds binds $[*].id with many',
        positiveExamplesTitle: 'Positive Examples',
        negativeExamplesTitle: 'Exclusion Examples',
        exampleRules: {
          onePerLine: 'Enter one complete utterance per line. Blank lines are ignored; do not enter a JSON array, comma list, or numbering.',
          realUtterance: 'Cover realistic wording, synonyms, and different information completeness; avoid broad words such as query or process.',
          negativePriority: 'Exclusion examples override triggers and positive examples. Include only similar requests that must not run this Skill.'
        },
        ragQueryTitle: 'Retrieval Query',
        ragQueryRule1: 'Leave blank to search the current user request. A fixed value always searches the same topic and suits stable policy material.',
        ragQueryRule2: 'Upstream references must name declared dependencies. Any unresolved double-brace reference fails the step.',
        queryHintTitle: 'Query Intent',
        queryHintRule1: 'Specify data object, filters, time range, metric convention, sorting, limit, and returned fields instead of saying only query related data.',
        queryHintRule2: 'The executor uses this text directly; it does not append the user request or substitute upstream step variables.',
        argumentsTitle: 'Built-in Tool Arguments',
        argumentsExample:
          'Date: operation=add, base_date=2026-08-05, amount=7, unit=days\nMath: expression=(125.5 + 86.3) * 0.9\nUnit conversion: value=1.5, from=kg, to=g',
        argumentsRule1: 'Argument names must follow the selected built-in Tool contract; arguments from different Tools cannot be mixed.',
        argumentsRule2: 'Every upstream reference requires a dependency. Pass raw numbers for money and quantities instead of formatted display text.',
        bindingFields: {
          paramName: 'Logical parameter name from the target API Tool properties. It is case-sensitive and must match exactly.',
          literal: 'Use literals for channels, versions, or constants. Object, array, number, and boolean text that is valid JSON is stored as that JSON type.',
          source: 'Upstream step ID supplying the value. It must also be selected as a dependency and complete successfully.',
          path: 'Restricted JSONPath into upstream primary data. Supports $, dotted fields, numeric indexes, and array wildcards, such as $[0].orderNo.',
          cardinality: 'one expects a single value; many expects an array. A mismatch fails at runtime.',
          onEmpty: 'fail rejects missing data; skip omits the parameter; default uses the configured default value.',
          defaultValue: 'Used only with on_empty=default and may be a string, number, boolean, object, or array.',
          onMultiple: 'When one receives several values, fail rejects them and first explicitly selects the first. The runtime never does this silently.',
          maxItems: 'Maximum array size retained by a many binding, from 1 to 200.',
          overflow: 'When the array exceeds max_items, fail rejects it and truncate cuts it to the limit.'
        },
        bindingRules: {
          dependency: 'Every source must be a dependency. A source that did not run, failed, or was skipped cannot be resolved.',
          safePath: 'Paths do not support filters, functions, recursive lookup, or scripts. Use Transform first for filtering, aggregation, or renaming.',
          toolSchema: 'Resolved parameters must satisfy the API Tool JSON Schema. The Tool executor adds property defaults for parameters not supplied.',
          transport:
            'Skills do not configure HTTP placement. The Tool uses x-in/in and x-http-name/httpName from the parameter Schema; legacy double-brace param URL placeholders remain supported without duplication.'
        },
        outputSchemaFields: {
          schema: 'Optional Draft 7 declaration. Keep it for easier review and migration.',
          metadata: 'Optional human-readable contract name and overall explanation; neither changes the output.',
          type: 'Root type of the step primary output: object, array, string, integer, number, boolean, or null.',
          properties: 'For object output, define allowed fields. Give every field a type and description plus business constraints where needed.',
          required: 'For object output, list fields that must be present. Every listed name must also exist in properties.',
          additionalProperties: 'Set false to reject fields outside properties, useful for downstream API parameters and stable structured output.',
          enumConst: 'enum restricts a value to a set; const restricts it to one fixed value, useful for status, kind, and version.',
          formatPattern: 'format describes date, date-time, email, or uri; pattern constrains string shape with a regular expression.',
          stringRange: 'Set minimum and maximum string length to reject empty reasons or oversized descriptions.',
          numberRange: 'Set numeric bounds and increments, such as a minimum of 0.01 and two-decimal money precision.',
          arrayRules: 'items defines each element Schema; minItems, maxItems, and uniqueItems control count and uniqueness.'
        },
        outputSchemaRules: {
          primaryData: 'The Schema validates primary data itself. It does not add a data or result wrapper and does not rename fields.',
          requiredProperties: 'required only enforces presence; define type, enum, length, and range separately under properties.',
          defaultValue: 'default in a Skill output Schema is annotation only and does not fill values. Use Transform default or explicit LLM instructions to generate defaults.',
          stableNames: 'Field names are case-sensitive and referenced directly downstream. Keep them stable after release.',
          validJson: 'Enter a valid JSON object only: no comments, trailing commas, single quotes, or JavaScript expressions.'
        },
        foreachFields: {
          items: 'Reference an upstream step by putting its ID, such as query_orders, inside double braces. It must be a dependency and return an array or an object containing one.',
          itemPath: 'When upstream returns an object, identify its array path, such as records or data.records. Omit it for direct arrays.',
          maxItems: 'Maximum items processed in this run, from 1 to 200. A larger input fails.',
          maxAttempts: 'Per-item attempts from 1 to 3. Non-idempotent Action APIs are not retried automatically.',
          continueOnError: 'true records an item failure and continues; false stops at the first failed item.',
          bodyType: 'Only api or builtin is supported. The body cannot nest foreach, call an LLM, or use web_search.',
          toolCode: 'Configured API Tool code or built-in Tool code invoked for each item.',
          bodyParams: 'Use params for API and arguments for built-ins. Put item, item.field, or zero-based index inside double braces to reference them.',
          outputSchema: 'Optional Draft 7 validation for the whole batch result object, not each individual Tool response.'
        },
        foreachRules: {
          dependency: 'The items source must be a dependency, and item_path must resolve to an array.',
          limit: 'max_items cannot exceed 200. Limit the upstream query and verify the count in Trial Run before a batch action.',
          retry: 'Non-idempotent Action APIs execute once even when max_attempts is greater than 1, preventing duplicate side effects.',
          body: 'An Action API receives one HITL for the batch. The body cannot use web_search or nest another loop.'
        },
        transformFields: {
          inputs: 'Name one or more upstream inputs. inputs is a name-to-binding object; input may be one binding. Every source must be a dependency.',
          sourcePath: 'source names the upstream step and path reads its primary data through restricted JSONPath.',
          bindingPolicies: 'Bindings support one/many, on_empty, on_multiple, default, max_items, and overflow with the same meaning as API parameter bindings.',
          operations: 'Execute 1 to 20 deterministic operations in array order. Every element must be a JSON object containing op.',
          op: 'Supported operations are select, filter, project, rename, distinct, sort, slice, limit, aggregate, object, merge, default, and cast.',
          operationFields: 'Fields vary by op: path selects data, fields projects/renames/builds objects, and value supplies a filter, default, or merge object.',
          outputSchema: 'Optional but strongly recommended Draft 7 contract for the final object or array. A mismatch blocks downstream execution.'
        },
        transformRules: {
          dependency: 'Every source under input/inputs must be a current-step dependency.',
          path: 'Paths support $, dotted fields, numeric indexes, and array wildcards only; no scripts, functions, recursion, or filter expressions.',
          operations: 'filter operators are equals, not_equals, in, contains, exists, gt, gte, lt, and lte; sort supports asc or desc only.',
          limits: 'At most 20 operations, 200 items, 1 MB JSON, and 32 nesting levels; every intermediate result is checked.'
        },
        promptTitle: 'Prompt Template',
        promptDescription:
          'State the task, available evidence, output format, and prohibitions. Reference complete outputs by placing a step ID in double braces and add every referenced step to Dependencies. Never invent absent fields or bypass permissions.',
        promptExample: 'Combine the policy and record steps into a conclusion, evidence, and open questions.',
        foreachTitle: 'Batch Loop Configuration',
        foreachDescription:
          'Iterates an upstream JSON array and runs one API or built-in body per item. Configure items, max_items, max_attempts, continue_on_error, and body. An Action API receives one HITL confirmation for the entire batch.',
        foreachExample:
          'items references query_records, at most 100 items are processed, and body references the current record id',
        transformInputsParameter: 'Transform input bindings',
        transformOperationsParameter: 'Transform operation sequence',
        transformOutputSchemaParameter: 'Transform output Schema'
      }
    },
    datasource: {
      pageGuide:
        'Save and test the read-only connection first, then configure queryable tables, columns, and visibility under Schema Access. Test Connection only checks connectivity; Test Schema executes controlled read-only SQL and writes a SQL audit record.',
      emptyHint: 'No data sources yet. Create and test a read-only connection first.',
      schemaTestWarning:
        'This calls NL2SQL, executes a controlled read-only query, and writes a SQL audit record. Use test input and confirm the current account can access this Schema.',
      name: 'Name',
      code: 'Code',
      dbType: 'Type',
      jdbcUrl: 'JDBC URL',
      testConn: 'Test',
      connSuccess: 'Connected',
      connFailed: 'Failed',
      maxConnections: 'Max Connections',
      queryTimeout: 'Timeout(s)',
      password: 'Password',
      passwordKeep: 'Leave blank to keep unchanged',
      username: 'Username',
      schemas: 'Schema Access',
      createSchema: 'Add Schema',
      domainCode: 'Domain Code',
      domainName: 'Domain Name',
      viewName: 'View Name',
      columnsMeta: 'Columns (JSON)',
      fewShotExamples: 'Examples (JSON)',
      allowedFunctions: 'Allowed Functions',
      allowedFunctionsPlaceholder: 'Select functions, or type a function name and press Enter',
      sensitiveColumns: 'Sensitive Columns (JSON)',
      namePlaceholder: 'Enter a data source name',
      codePlaceholder: 'Enter a unique code, e.g. member_db',
      dbTypePlaceholder: 'Select a database type',
      jdbcPlaceholder: 'Enter the complete JDBC URL',
      usernamePlaceholder: 'Enter a read-only database account',
      domainCodePlaceholder: 'Enter a unique domain code',
      domainNamePlaceholder: 'Enter a domain name',
      viewNamePlaceholder: 'Enter an allowed table or view name',
      descriptionPlaceholder: 'Describe the business meaning of this schema',
      jsonArrayPlaceholder: 'Enter a JSON array, e.g. []',
      requiredFields: 'Name, code, database type, URL and username are required',
      schemaRequiredFields: 'Domain code, domain name and table or view are required',
      deleteConfirm:
        'This also removes every Schema. The backend blocks deletion when an enabled Skill references it; still check disabled Skills and automation workflows first. Continue?',
      schemaDeleteConfirm:
        'The table or view will stop participating in future NL2SQL queries. Historical SQL audit records remain. Continue?',
      schemaTestTitle: 'Schema Query Test',
      testSchema: 'Test Schema',
      testQuestion: 'Test Question',
      testQuestionPlaceholder: 'Enter a natural-language query',
      testQuestionRequired: 'Enter a test question',
      defaultTestQuestion: 'Show the first 10 records from {name}',
      defaultDomainName: 'this domain',
      querySuccess: 'Query succeeded, returned {count} rows',
      queryFailed: 'Query failed',
      generatedSql: 'Generated SQL',
      close: 'Close',
      startTest: 'Start Test'
    },
    tool: {
      pageGuide:
        'After saving, keep Real Request off to validate parameters and request rendering first. Turning it on calls the external API immediately and bypasses chat HITL; automation workflows also do not show chat confirmation.',
      emptyHint: 'No API tools yet. Create one from the external contract and complete a dry-run first.',
      realActionConfirmTitle: 'Confirm Action API Call',
      realActionConfirm:
        'This tool is classified as Action. Continuing calls the external API immediately and may create, update, or delete business data without chat HITL. Continue?',
      confirmExecute: 'Execute',
      name: 'Name',
      code: 'Code',
      description: 'Description',
      method: 'Method',
      operationType: 'Operation',
      query: 'Query',
      actionType: 'Action',
      authType: 'Auth',
      urlTemplate: 'URL Template',
      timeout: 'Timeout(s)',
      retryCount: 'Retries',
      basicInfo: 'Basic',
      authConfig: 'Auth Config',
      authPlaceholder: 'Enter JSON; stored secrets are never shown again',
      identityPropagation: 'Send User Identity',
      identityHeaderName: 'Identity Header',
      paramSchema: 'Param Schema',
      requestHeaders: 'Request Headers',
      requestTemplate: 'Request Template',
      responseMapping: 'Response Mapping',
      visibility: 'Visibility',
      department: 'Department',
      post: 'Post',
      user: 'User',
      namePlaceholder: 'Enter a tool name',
      codePlaceholder: 'Enter a unique code, e.g. query_coupon',
      descriptionPlaceholder: 'Describe the purpose, conditions and returned data',
      urlPlaceholder: 'Enter the endpoint base URL; keep a double-brace param placeholder only for path parameters',
      departmentPlaceholder: 'Select authorized departments',
      postPlaceholder: 'Select authorized posts',
      userPlaceholder: 'Select authorized users',
      identityHeaderPlaceholder: 'Enter the user identity header name',
      paramSchemaPlaceholder: 'Enter a JSON Schema',
      headersPlaceholder: 'Enter a JSON request-header object',
      requestPlaceholder: 'Enter a JSON request template',
      responsePlaceholder: 'Enter a JSON response mapping',
      requiredFields: 'Name, code and URL template are required',
      deleteConfirm:
        'The backend blocks deletion when an enabled Skill references this tool. Still check disabled Skills and automation workflows first; the Agent cannot call it afterward. Continue?',
      credentialKeepHint:
        'Stored credentials are never displayed. Leave all credential fields blank to retain the current secret; entering any secret requires the complete credential set and replaces it as a whole.',
      unsupportedAuthType: 'Unsupported authentication type',
      authFieldRequired: 'Enter authentication field: {field}',
      testTitle: 'Tool Test',
      testTool: 'Test Tool',
      inputJson: 'Input JSON',
      realRequest: 'Real Request',
      dryRunHint: 'When disabled, only validate parameters and render the request without calling the external API',
      requestMethod: 'Method',
      requestUrl: 'URL',
      requestHeader: 'Headers',
      requestBody: 'Body',
      responseResult: 'Response',
      rawView: 'Raw',
      errorMessage: 'Error',
      dryRunPassed: 'Configuration validated and request rendered',
      requestCompleted: 'Tool request completed',
      configInvalid: 'Tool configuration or input parameters are invalid',
      close: 'Close',
      startTest: 'Start Test',
      authFields: {
        token: 'Bearer Token',
        username: 'Username',
        password: 'Password',
        header: 'Header Name',
        value: 'API Key',
        accessKey: 'Access Key (AK)',
        secretKey: 'Secret Key (SK)'
      }
    },
    experience: {
      pageGuide:
        'Reliable knowledge answers are captured automatically and reused only for the same question while sources and the current user ACL remain valid. Delete means eliminate; this page cannot restore it.',
      emptyHint: 'No experiences yet. Reliable knowledge answers are captured automatically after quality checks.',
      queryText: 'Question',
      qualityScore: 'Score',
      hitCount: 'Hits',
      visibility: 'Visibility',
      lastHitAt: 'Last Hit',
      minScore: 'Minimum score',
      eliminated: 'Eliminated',
      unknownSource: 'Unknown source',
      updateScore: 'Score',
      updateVisibility: 'Visibility',
      deleteConfirm: 'This experience can no longer be reused and cannot be restored on this page. Continue?',
      detailTitle: 'Experience Detail',
      answer: 'Answer',
      sourceChunks: 'References'
    },
    badCase: {
      pageGuide:
        'A record is created only after a user submits negative feedback on an assistant answer. Labeling a correct answer supports later review; it does not update knowledge, Skills, or rerun the answer.',
      emptyHint: 'No Bad Cases yet. Negative user feedback creates pending records automatically.',
      pending: 'Pending',
      labeled: 'Labeled',
      exported: 'Resolved',
      userQuery: 'Question',
      feedbackType: 'Feedback Type',
      feedbackReason: 'Additional Details',
      label: 'Label',
      correctAnswer: 'Correct Answer',
      labelTitle: 'Label Bad Case',
      searchPlaceholder: 'Search user questions',
      labelPlaceholder: 'Enter a verified correct answer; saving does not update knowledge or rerun the answer',
      detailTitle: 'Bad Case Detail',
      question: 'Question',
      aiAnswer: 'AI Answer',
      retrievalResults: 'Retrieval Results',
      sessionId: 'Session ID',
      messageId: 'Message ID'
    },
    sqlLog: {
      pageGuide:
        'This page records successful, blocked, and failed NL2SQL attempts without storing result rows. Test Connection creates no record; Test Schema does.',
      emptyHint: 'No SQL audit records yet. Run NL2SQL or Test Schema to create one.',
      naturalQuery: 'Natural Query',
      generatedSql: 'Generated SQL',
      execTime: 'Time(ms)',
      rowCount: 'Rows',
      detailTitle: 'SQL Detail',
      finalSql: 'Final SQL',
      blockReason: 'Block/Failure Reason',
      searchPlaceholder: 'Search natural-language questions or SQL'
    },
    audit: {
      pageGuide:
        'This page records chat HITL decisions for Action APIs. Confirmed only allows execution to continue; it does not prove the external call succeeded. See SQL Audit for ordinary NL2SQL.',
      emptyHint: 'No operation audits yet. Chat Action APIs create records when they enter HITL.',
      actionType: 'Action Type',
      toolCode: 'Tool/Code',
      riskLevel: 'Risk',
      confirmed: 'Confirmed',
      cancelled: 'Cancelled',
      timeout: 'Timeout',
      detailTitle: 'HITL Detail',
      toolInput: 'Tool Input',
      cancelReason: 'Reason',
      contextSnapshot: 'Context',
      userId: 'User ID',
      user: 'User',
      userPlaceholder: 'Select a user'
    },
    configFields: {
      datasource: {
        fields: {
          name: 'Enter an administrator-friendly display name; it does not affect the database connection.',
          code: 'Enter a stable tenant-unique code used by Skills and logs; prefer lowercase letters, digits, and underscores.',
          dbType:
            'Choose the actual database type so the system can validate the JDBC URL and load the matching driver. MySQL, PostgreSQL, Oracle, and SQL Server are supported.',
          jdbcUrl:
            'Enter the complete JDBC URL reachable from the backend, including host, port, and database. In a container, localhost means that container.',
          username:
            'Enter a dedicated read-only database account with write, DDL, and administrative privileges revoked.',
          password:
            'Required when creating. Leave blank while editing to retain the stored password; entering a value replaces it.',
          maxConnections:
            'Set this data source pool limit from 1 to 100 to bound concurrent connections; start with 5 to 10.',
          queryTimeout:
            'Set per-query timeout from 5 to 300 seconds. Timed-out queries are cancelled and recorded as failures; start with 30 seconds.',
          status:
            'Only enabled data sources can be used by NL2SQL and Skills. Disabling retains Schemas and audit history.'
        },
        dbTypeDescription:
          'Choose the actual database type so the system can validate the JDBC URL and load the driver. MySQL, PostgreSQL, Oracle, and SQL Server are supported.',
        fieldExamples: {
          name: 'Member Business Read-only DB',
          password: 'Strong password issued by the DBA (never displayed again)'
        }
      },
      schema: {
        fields: {
          domainCode:
            'Enter a stable code unique within the data source for logs and executor lookup; prefer lowercase letters, digits, and underscores.',
          domainName:
            'Enter a business-readable query domain name such as Member Spending Analytics; the model sees it when selecting a Schema.',
          viewName: 'Enter a real read-only table or masked view. Generated SQL may access only the declared object.',
          description:
            'Explain data scope, metric definitions, time semantics, enums, and limitations so the model can select and query the Schema correctly.',
          columnsMeta:
            'Enter a JSON array, preferably objects with name, type, and description. A non-empty array enforces the column allowlist and rejects SELECT *. An empty array does not restrict queryable columns and must not be used in production.',
          fewShotExamples:
            'Enter a JSON array of typical questions and manually verified read-only SQL. Every example must obey this Schema table, column, and function policy.',
          allowedFunctions:
            'Enter allowed SQL function names, for example ["COUNT","SUM"]. An empty array means no function allowlist restriction, not deny all functions.',
          sensitiveColumns:
            'Enter a JSON array of forbidden column names as defense in depth. Prefer masked database views for primary protection.',
          visibility:
            'Choose Public, Department, Post, or User. Runtime uses the user current organization relationship; role is not an ACL subject.',
          aclSubjects:
            'For restricted visibility, select one or more matching departments, posts, or users; otherwise saving fails.',
          status:
            'The Schema is sent to the LLM only when enabled and ACL-authorized. Disabling removes it from subsequent query context immediately.'
        },
        fieldExamples: {
          domainName: 'Member Spending Analytics',
          description: 'Aggregate paid amount by member and month in yuan; refunded orders are excluded.',
          aclSubjectName: 'Authorized Subjects',
          aclSubjects: 'Marketing, Research and Development (multiple allowed)'
        }
      },
      tool: {
        fields: {
          name: 'Enter a tool name understandable to configurators and end users. Result cards should show this name instead of only internal IDs.',
          code: 'Enter a stable tenant-unique code used by Skills, plans, and audits; prefer lowercase letters, digits, and underscores.',
          description:
            'Describe when to call it, required information, returned data, limitations, and unsuitable cases. It can be saved empty, but the Agent then lacks the semantics needed for reliable tool selection.',
          urlTemplate:
            'Enter the endpoint base HTTPS URL, such as https://api.example.com/v1/orders. The executor appends query values and builds body/header values from the parameter Schema. Only path parameters need a matching logical name wrapped in double braces in the URL. Legacy URL templates remain supported without duplicate parameters, and the global outbound policy still applies.',
          httpMethod:
            'Choose the real external method. GET, POST, PUT, and DELETE are supported; classify side effects by actual behavior.',
          operationType:
            'Query is only for side-effect-free calls. Create, update, delete, send, approve, or uncertain side effects must be Action. Interactive chat forces HITL, but real tool tests and automation workflows do not show chat confirmation.',
          visibility:
            'Choose Public, Department, Post, or User. The tool is injected only for authorized chat users in the tenant; administrator tool tests are not restricted by this scope.',
          aclSubject:
            'For restricted visibility select one matching department, post, or user. Tool ACL is single-select and role is not an ACL subject.',
          timeout:
            'Set the HTTP call timeout in seconds below the overall task timeout and according to provider SLA to avoid occupying executor threads.',
          retryCount:
            'Set 0 to 2 retries. Only idempotent methods such as GET, PUT, and DELETE are retried; POST is never automatically retried.',
          status:
            'Only enabled tools enter the authorized catalog for planning. Disabling retains configuration and audit history.',
          authType:
            'Choose None, Bearer, Basic, API Key, or the platform fixed AK/SK signature required by the external service.',
          authConfig:
            'Enter credentials through the structured fields. Secrets are backend-only and never displayed; leave all blank to retain the same type, or fully re-enter when changing type.',
          identityPropagation:
            'Enable only when the provider can verify the platform-signed user context. It is valid for about 60 seconds and does not replace platform ACL checks.',
          identityHeaderName:
            'Enter the HTTP header carrying the signed user context, default X-Platform-User-Context. The provider must implement the platform verification protocol.',
          paramSchema:
            'Enter a JSON Schema Draft 7 object defining logical parameter types, business meanings, enums, formats, ranges, and required fields. Each property may use x-in/in for query, path, body, or header; x-http-name/httpName for the external name; and default for a missing value. Without x-in, GET/DELETE use query and POST/PUT use body. Blank optional values are omitted.',
          requestHeaders:
            'Enter a JSON header object whose values may use parameter placeholders. Insert common Accept or Content-Type headers from presets; never store authentication secrets here.',
          requestTemplate:
            'Optional. Normally the executor builds the JSON body from x-in/in and x-http-name/httpName in the parameter Schema. Use a template only for nested structures, fixed fields, or special composition. Variables must exist in the Schema; explicit body parameters are merged into an object template without overwriting fields already present in it.',
          responseRule:
            'Optional. Empty means any HTTP 2xx succeeds with the full response. Otherwise restrict success statuses, evaluate business status with equals, in, exists, or not_empty, and optionally extract dataPath.',
          responseMapping:
            'Optional JSON mapping from platform field names to paths after success-rule extraction. A missing path fails the call instead of returning null.'
        },
        authDescription:
          'Use the structured fields for the selected type: token for Bearer; username and password for Basic; header and value for API Key; accessKey and secretKey for AK/SK. The platform fixes HMAC-SHA256 signing and generates X-Platform-Access-Key, X-Platform-Timestamp, X-Platform-Nonce, and X-Platform-Signature headers; the algorithm is not configurable. Leaving every field blank while editing the same type retains the secret.',
        step3:
          'Choose authentication and enter credentials in the structured form. Enable identity propagation only when the external service can verify the signed platform user context.',
        fieldExamples: {
          name: 'Query Available Coupons',
          description:
            'Find currently active coupons by amount and threshold and return ID, name, amount, threshold, and validity; does not grant coupons.',
          aclSubjectName: 'Authorized Subject',
          aclSubject: 'Marketing (single selection)'
        }
      }
    },
    configHelp: {
      datasource: {
        title: 'Data Source Help',
        description:
          'A data source stores a tenant read-only database connection for controlled NL2SQL queries. It defines how to connect but does not expose any table or column automatically. After saving and testing the connection, configure access-controlled Schemas separately.',
        example:
          'Name: Business Read-only Database\nCode: business_readonly\nType: MySQL\nJDBC URL: jdbc:mysql://db.example.com:3306/business\nUser: agent_readonly\nMax connections: 10\nQuery timeout: 30 seconds',
        note1:
          'Use a dedicated read-only account and revoke INSERT, UPDATE, DELETE, DDL, and administrative privileges at the database.',
        note2:
          'A successful connection does not make NL2SQL usable. At least one enabled and authorized Schema is required.',
        note3: 'In production, do not expose the database publicly or put passwords in names, URLs, or descriptions.',
        step1:
          'Ask a database administrator to create a least-privilege read-only account limited to approved tables or masked views.',
        step2: 'Enter a name, tenant-unique code, database type, JDBC URL, and read-only credentials.',
        step3:
          'Set pool and query limits for the database capacity. Start with 5–10 connections and a 30-second timeout.',
        step4: 'Save and run Test Connection to verify backend network reachability and authentication.',
        step5:
          'Open Schema Access and configure tables/views, columns, examples, and four-level visibility for each query domain.',
        rule1: 'Keep the code stable after saving so existing Skills do not lose their reference.',
        rule2: 'The JDBC URL must match the database type and include an explicit host, port, and database name.',
        rule3:
          'The pool limit only controls this platform; also configure account concurrency and resource limits in the database.',
        rule4: 'Disabling the data source prevents associated NL2SQL and Skill steps from executing.',
        effect1:
          'Credentials are stored by the backend and used for a tenant-isolated connection pool; stored passwords are not displayed during editing.',
        effect2:
          'Only Schemas filtered by the current user permissions are sent to the LLM. A connected data source never exposes the whole database.',
        jdbcTitle: 'JDBC URL',
        jdbcDescription:
          'Enter the complete JDBC URL reachable from the backend service, including protocol, host, port, and database. This is not a browser URL; in a container, localhost refers to that container. For MySQL, specify character encoding and timezone.',
        jdbcExample:
          'jdbc:mysql://db.internal:3306/business?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai'
      },
      schema: {
        title: 'Schema Access Help',
        description:
          'A Schema is the security and semantic boundary for NL2SQL. It defines visible tables/views, allowed columns, business meanings, functions, sensitive fields, and authorized subjects. Each request filters Schemas by tenant and the current user’s department, post, or user grant before prompting the model.',
        example:
          'Domain: Order Statistics\nCode: order_summary\nView: v_order_summary_masked\nVisibility: Authorized Departments (multiple)\nColumns: order date, status, masked amount',
        note1:
          'Prefer masked views containing only approved fields. Empty column metadata does not enable a column allowlist, and sensitive-column settings do not replace database views or privileges.',
        note2:
          'Few-shot SQL may only use tables, columns, and functions exposed by this Schema and must remain read-only.',
        note3:
          'Test Schema executes a real read-only query and writes a SQL audit record. It checks the current signed-in user ACL and is not a SQL-only preview.',
        step1: 'Enter a stable code, clear name, and business description for one coherent query domain.',
        step2: 'Choose one read-only table or masked view and avoid mixing unrelated business tables.',
        step3:
          'Define allowed column names, database types, and meanings as a non-empty JSON array, including units, enums, time semantics, and join keys when needed.',
        step4:
          'Add a few verified natural-language/read-only-SQL examples, restrict functions, and identify sensitive fields.',
        step5:
          'Choose Public, Department, Post, or User visibility and select one or more subjects for restricted modes.',
        step6:
          'Save the Schema, then click Test Schema from its row. Use a realistic question available to the current account; verify ACL isolation separately from chat or a Skill with an unauthorized account.',
        rule1: 'The domain code is unique within the data source; the table/view must exist and be read-only.',
        rule2:
          'Columns, few-shot examples, allowed functions, and sensitive columns must be valid JSON arrays. Empty column metadata does not form a column allowlist.',
        rule3:
          'Classification and ACL are one concept. Role is not an ACL subject; only Public, Department, Post, and User are supported.',
        rule4: 'Generated SQL still passes parsing, read-only, Schema-scope, row-limit, and timeout checks.',
        effect1: 'When enabled, the Schema appears in the NL2SQL prompt only for users satisfying its ACL.',
        effect2:
          'Disabling or deleting it removes the structure from future queries while retaining existing audit records.',
        descriptionTitle: 'Business Description',
        descriptionRule1: 'Explain data scope, metric definitions, units, status enums, time semantics, and exclusions instead of repeating the domain name.',
        descriptionRule2: 'The model reads this text when selecting a Schema and generating SQL. Incorrect semantics can produce wrong metrics but cannot bypass backend field or function checks.',
        columnsTitle: 'Column Metadata',
        columnsDescription:
          'Enter a non-empty JSON array where each item contains a real column name, database type, and clear business description. Include units, enums, time semantics, aggregation rules, and join keys. When non-empty, unlisted columns are blocked and SELECT * is rejected; an empty array does not restrict columns.',
        columnsExample:
          'Each item contains name, type, and description; for example, explain all allowed values of an order status column',
        columnsFields: {
          root: 'The root must be a JSON array. Each item describes one real database column that queries may use.',
          name: 'Real database column name used by the enforced allowlist. Enter the physical name, not a display label or SQL alias.',
          type: 'Actual database type and precision, helping the model compare, aggregate, and format values. The backend does not currently use it for JDBC type validation.',
          description: 'Business meaning including units, enum values, time semantics, aggregation rules, and relationships to other fields.',
          descriptionExample: 'Paid amount in yuan; may be summed; refunded orders retain the original paid amount'
        },
        columnsRule1: 'A non-empty array enables the column allowlist and rejects SELECT *. Do not use an empty array in production.',
        columnsRule2: 'name determines allowed columns. type and description guide the model and cannot replace the physical column name.',
        fewShotTitle: 'Query Examples',
        fewShotDescription:
          'Enter a JSON array of typical natural-language questions and manually verified read-only SQL. Examples explain business conventions and must not fix a specific user or date or reference hidden columns. A few high-quality examples are better than many duplicates.',
        fewShotExample:
          '“Count completed orders by month” maps to an aggregate using completion time and completed status',
        fewShotFields: {
          root: 'The root must be a JSON array. Each item pairs one user question with its correct SQL.',
          question: 'A realistic business question that expresses the intended convention, not only an SQL feature name.',
          questionExample: 'Count orders by order status',
          sql: 'One manually verified read-only SELECT for the target database using only this Schema view, columns, and allowed functions.'
        },
        fewShotRule1: 'Do not use INSERT, UPDATE, DELETE, DDL, multiple statements, named parameters, or unauthorized fields. Examples are not parameterized statements.',
        fewShotRule2: 'Avoid one specific user, order, or soon-stale absolute date. Use a few examples for error-prone enums, time semantics, and metrics.',
        functionsTitle: 'Allowed Functions',
        functionsDescription:
          'Select or enter SQL function names the model may use for this Schema. They are stored as a string array and checked by name; platform safe read-only functions remain governed by built-in rules.',
        functionsRule1: 'Use functions supported by the actual database and prefer uppercase for review. Do not mix MySQL DATE_FORMAT with PostgreSQL DATE_TRUNC.',
        functionsRule2: 'An empty array means no additional function allowlist, not deny all. For strict control, keep only functions required by the domain.',
        sensitiveTitle: 'Sensitive Columns',
        sensitiveDescription:
          'Enter a JSON array of physical columns that NL2SQL must never reference. SQL containing one of these identifiers is blocked as defense in depth beyond the allowlist.',
        sensitiveRule1: 'Enter physical database column names, not display labels, JSON paths, or masked aliases. Matching is case-insensitive.',
        sensitiveRule2: 'This does not replace masked views and least-privilege accounts. Remove highly sensitive fields from the view instead of relying only on application checks.',
        jsonRule: 'Enter valid JSON using double quotes, with no comments, trailing commas, or single quotes.',
        visibilityTitle: 'Visibility',
        visibilityDescription:
          'Public is available to tenant users with NL2SQL permission. Department, Post, and User apply additional subject restrictions and allow multiple selections. Restricted modes require at least one subject, and Schema tests also check the current signed-in user membership.'
      },
      tool: {
        title: 'API Tool Help',
        description:
          'An API tool declares an existing tenant HTTP endpoint as an Agent capability. It must explain when to call it, required input, authentication, request construction, success evaluation, and result interpretation. Visibility and operation type govern interactive use.',
        example:
          'Name: Query Business Records\nCode: query_records\nPurpose: Search by name or code and return record code, name, and status\nType: Query\nMethod: POST\nURL: https://api.example.com/v1/records/search',
        note1:
          'Every endpoint that creates, changes, deletes, sends, approves, or affects external state must be Action. Chat forces HITL, but real tests and automation workflows call directly.',
        note2:
          'Authentication secrets are encrypted and not displayed after saving; never put them in URLs, headers, templates, prompts, or Skill parameters.',
        note3:
          'Save the tool before testing. Run dry-run first. Real request bypasses HITL, so test action endpoints only against a test environment, idempotent input, or recoverable data.',
        step1:
          'Enter a stable name, unique code, and capability description covering call conditions, required information, returned data, and limitations.',
        step2:
          'Enter the endpoint base URL, HTTP method, timeout, and retries. Keep double-brace same-name placeholders only for path parameters, then classify the endpoint as Query or Action by its real business impact.',
        step3:
          'Choose authentication and use the structured credential fields. Propagate identity only when the external service verifies the signed context.',
        step4:
          'Define logical input fields, types, meanings, required fields, formats, and enums in JSON Schema Draft 7. Use x-in/in, x-http-name/httpName, and default to declare HTTP placement, external names, and defaults.',
        step5:
          'Configure fixed headers as needed. Add a JSON body template only for nested objects, fixed fields, or special composition; ordinary query, body, and header values are constructed automatically from the Schema.',
        step6:
          'Configure the success rule first to evaluate HTTP/business success and extract dataPath, then map the extracted response to stable readable fields.',
        step7:
          'Set Public or one authorized Department, Post, or User, save, run dry-run, and verify selection, clarification, HITL, and rendering in real chat.',
        rule1:
          'Tool codes are tenant-unique and stable. Descriptions must not claim unsupported query or action capabilities.',
        rule2:
          'Parameter Schema, headers, request template, success rule, and response mapping must be valid JSON; credentials use the structured form.',
        rule3: 'Query tools must have no side effects. If side effects are uncertain, classify the endpoint as Action.',
        rule4: 'Only idempotent methods are retried. POST does not retry even when retry count is greater than zero.',
        effect1:
          'When enabled, the Agent injects the tool definition only for users allowed by tenant and ACL and may plan calls using its description and Schema.',
        effect2:
          'Action tools in chat create a readable confirmation card after parameters resolve. Real tool tests and automation workflows do not use this chat HITL.',
        operationTitle: 'Query or Action',
        operationDescription:
          'Query is only for side-effect-free endpoints. Action covers create, update, delete, send, approve, grant, or any external state change. Chat forces confirmation; real tool tests execute immediately, and automation approvals must be explicit workflow nodes.',
        authTitle: 'Authentication',
        authDescription:
          'Use structured fields: Bearer token, Basic username/password, API Key header/value, or AK/SK accessKey/secretKey. The platform generates fixed HMAC-SHA256 headers and does not support a custom algorithm. Leaving all fields blank while editing the same type retains the secret.',
        authExample:
          'API Key: X-API-Key and key value; AK/SK: accessKey and secretKey (signature headers are generated)',
        schemaTitle: 'Parameter Schema',
        schemaDescription:
          'Use JSON Schema Draft 7 for every logical parameter the Agent may submit. Give each field a type and business description; add enum, format, bounds, and required as needed. x-in/in accepts query, path, body, or header; x-http-name/httpName sets the external name; default supplies only missing values. Without x-in, GET/DELETE default to query and POST/PUT to body. Optional null or blank-string values are omitted. A path parameter must have its same logical name wrapped in double braces in the URL.',
        schemaExample: 'The full example covers path, query, body, header, external-name mapping, enums, bounds, defaults, and required fields',
        requestTitle: 'Request Template',
        requestDescription:
          'The request template is optional because the parameter Schema can route values to query, path, body, or header and rename them with x-http-name/httpName. Use a template only for nested JSON, fixed fields, or special composition; variables must match the Schema. Explicit body parameters merge into an object template without replacing existing fields. A whole-value placeholder preserves its type, while an embedded one becomes text. Legacy double-brace param URL templates remain supported without duplicate appends.',
        requestExample: 'Use /orders/ followed by orderNo in double braces; status and page become query values, requestId becomes a header, and reason becomes operation_reason in the body',
        responseTitle: 'Success Rule and Response Mapping',
        responseDescription:
          'The success rule checks HTTP and business status and may extract dataPath. Response mapping then maps paths from the extracted node to stable business fields. Preserve downstream IDs but also return readable names/statuses; any missing path fails the call.',
        responseExample: 'With dataPath=data, map id to recordId, name to recordName, and status_name to statusName'
      }
    },
    quota: { total: 'Total', success: 'Success', blocked: 'Blocked' }
  },
  automation: {
    enum: {
      status: {
        draft: 'Draft',
        published: 'Published',
        disabled: 'Disabled',
        archived: 'Archived',
        superseded: 'Superseded',
        created: 'Created',
        queued: 'Queued',
        pending: 'Pending',
        ready: 'Ready',
        readyToResume: 'Ready to resume',
        running: 'Running',
        waiting: 'Waiting',
        waitingEvent: 'Waiting for event',
        waitingTimer: 'Waiting for timer',
        pendingApproval: 'Pending approval',
        retryWait: 'Waiting to retry',
        success: 'Success',
        partialFailure: 'Partial failure',
        failed: 'Failed',
        cancelled: 'Cancelled',
        skipped: 'Skipped',
        open: 'Open',
        replayed: 'Replayed',
        discarded: 'Discarded',
        received: 'Received',
        processed: 'Processed',
        started: 'Started',
        matched: 'Matched',
        unmatched: 'Unmatched',
        rejected: 'Rejected',
        approved: 'Approved',
        timeout: 'Timed out'
      },
      triggerType: {
        manual: 'Manual',
        cron: 'Schedule',
        webhook: 'Webhook',
        event: 'Internal event',
        approval: 'Approval callback',
        retry: 'Retry',
        subflow: 'Subflow'
      },
      sourceType: { internal: 'Internal event', webhook: 'Webhook', cron: 'Schedule', approval: 'Approval callback' },
      failureType: {
        validation: 'Validation failure',
        auth: 'Authentication or authorization failure',
        rateLimit: 'Rate limited',
        timeout: 'Execution timeout',
        transient: 'Transient connection failure',
        business: 'Business processing failure',
        policy: 'Policy blocked',
        cancelled: 'Task cancelled',
        unknown: 'Unknown failure'
      },
      eventType: {
        approval: 'Approval callback event',
        webhook: 'Webhook event',
        afterSalesAcceptance: 'After-sales acceptance event',
        runStarted: 'Run started',
        runCompleted: 'Run completed',
        runCancelled: 'Run cancelled',
        runRetried: 'Run retried',
        runReconciled: 'Run reconciled',
        nodeStarted: 'Node started',
        nodeCompleted: 'Node completed',
        nodeFailed: 'Node failed',
        nodeFailedHandled: 'Node failure handled',
        nodeRetryScheduled: 'Node retry scheduled',
        eventWaitStarted: 'Event wait started',
        eventWaitCompleted: 'Event wait completed',
        externalEventReceived: 'External event received'
      }
    },
    common: {
      refresh: 'Refresh',
      search: 'Search',
      reset: 'Reset',
      save: 'Save',
      cancel: 'Cancel',
      edit: 'Edit',
      create: 'Create',
      action: 'Actions',
      status: 'Status',
      type: 'Type',
      name: 'Name',
      workflow: 'Workflow',
      version: 'Version',
      allStatus: 'All statuses',
      enabled: 'Enabled',
      disabled: 'Disabled',
      enable: 'Enable',
      disable: 'Disable',
      createdAt: 'Created at',
      updatedAt: 'Updated at',
      completedAt: 'Completed at',
      startedAt: 'Started at',
      errorCode: 'Error code',
      errorSummary: 'Error summary',
      executor: 'Worker',
      runId: 'Run ID',
      nodeRun: 'Node run',
      attempts: 'Attempts',
      attempt: 'Attempt',
      itemKey: 'Item key',
      payloadHash: 'Payload hash',
      errorCategory: 'Error category',
      totalItems: '{count} total',
      totalRecords: '{count} records',
      configurationHelp: 'Configuration help',
      jsonInvalid: '{field} must be valid JSON',
      copied: 'Copied',
      default: 'Default',
      locate: 'Locate',
      previous: 'Back',
      next: 'Next',
      loadFailed: 'Unable to load automation data. Check the service and try again.',
      retryLoad: 'Retry',
      tenantRequired: 'Automation data is tenant-scoped. Select an active tenant before continuing.'
    },
    workflow: {
      title: 'Workflow Design',
      description: 'Manage publishable and resumable automation definitions',
      create: 'New workflow',
      searchPlaceholder: 'Search name or code',
      draft: 'Draft',
      published: 'Published',
      archived: 'Archived',
      descriptionLabel: 'Description',
      openDesigner: 'Open designer',
      saved: 'Saved',
      dirty: 'Unsaved changes',
      saving: 'Saving',
      conflict: 'Save conflict',
      saveError: 'Save failed',
      reload: 'Reload',
      readonlyDsl: 'Read-only DSL',
      validate: 'Validate',
      testRun: 'Test run',
      runPublishedVersion: 'Run published v{version}',
      noPublishedVersion: 'Not published',
      publish: 'Publish',
      viewAllErrors: 'View all {count}',
      createTitle: 'Create Workflow',
      code: 'Code',
      createAndDesign: 'Create and design',
      input: 'Workflow input',
      variables: 'Run variables',
      submitRun: 'Submit run',
      dslTitle: 'Workflow DSL (read-only)',
      nameRequired: 'Enter a workflow name',
      codeRequired: 'Enter a workflow code',
      codeRule: 'Use 3-64 lowercase letters, digits, or underscores, starting with a letter',
      created: 'Workflow created',
      conflictMessage: 'This draft changed in another session. Reload before continuing.',
      draftSaved: 'Draft saved',
      validationPassed: 'Workflow validation passed',
      validationFailed: '{count} issues found',
      publishConfirm: 'After publishing v{version}, runs will remain pinned to that version.',
      publishTitle: 'Publish workflow',
      publishedMessage: 'Workflow published',
      runJsonInvalid: 'Run input must be valid JSON',
      publishedRunHint: 'Manual runs execute only the published version, not an unpublished draft in the designer',
      publishBeforeRun: 'Validate and publish the workflow before running it',
      publishedRunNotice: 'This starts published version v{version} and creates a real run record.',
      draftNotIncluded:
        'The designer shows draft v{draftVersion}; this run executes published v{publishedVersion} and excludes draft changes.',
      archive: 'Archive',
      restore: 'Restore',
      delete: 'Delete',
      archiveConfirm: 'Archive "{name}"? All enabled triggers for this workflow will be disabled.',
      deleteConfirm: 'Delete unused draft "{name}"? This action cannot be undone.',
      archivedMessage: 'Workflow archived and its triggers disabled',
      restoredMessage: 'Workflow restored as an editable draft',
      deletedMessage: 'Draft workflow deleted',
      runSubmitted: 'Run #{id} submitted',
      template: 'Starter template',
      namePlaceholder: 'For example: Automatic Customer Complaint Handling',
      codePlaceholder: 'For example: auto_customer_complaint',
      descriptionPlaceholder: 'Describe triggers, goals, outputs, and unsupported scenarios',
      templates: {
        blank: 'Blank workflow',
        sequential: 'Sequential processing',
        approval: 'External approval',
        batch: 'Batch processing'
      },
      templateHints: {
        blank: 'Start and end nodes only',
        sequential: 'Input transform and API nodes',
        approval: 'Wait state with success and timeout exits',
        batch: 'Batch loop with throttling defaults'
      }
    },
    trigger: {
      title: 'Trigger Management',
      description: 'Configure workflow entry points, activation, and signing secrets',
      cron: 'Schedule',
      webhook: 'Webhook',
      event: 'Internal event',
      approval: 'Approval provider',
      createType: 'New {type}',
      editType: 'Edit {type}',
      selectWorkflow: 'Select a workflow',
      overlapPolicy: 'Overlap policy',
      publicKey: 'Public key',
      nextFireAt: 'Next run',
      triggerConfig: 'Trigger configuration',
      providerId: 'Approval provider ID',
      signatureSummary: '{seconds}s signature window',
      invalidStoredConfig: 'Configuration cannot be parsed',
      rotateSecret: 'Rotate secret',
      cronExpression: 'Spring Cron (6 fields)',
      cronPreset: 'Frequency',
      timezone: 'IANA timezone',
      misfireWindow: 'Misfire window (seconds)',
      signatureWindow: 'Signature window (seconds)',
      eventType: 'Event type',
      callbackSchema: 'Callback Schema',
      payloadSchema: 'Payload Schema',
      input: 'Workflow input',
      variables: 'Run variables',
      required: 'Select a workflow and enter a name',
      updated: 'Trigger updated',
      created: 'Trigger created',
      enabled: 'Trigger enabled',
      disabled: 'Trigger disabled',
      rotateConfirm: 'The old secret stops working immediately. Continue?',
      secretOnce: 'Secret shown once',
      secretWarning: 'Store it in a secure secret manager now. It cannot be viewed again.',
      callbackPath: 'Callback path',
      signingSecret: 'Signing secret',
      savedSecret: 'Stored securely',
      formatJson: 'Format JSON',
      fillExample: 'Use example',
      workflowHelp: 'Only published workflows are listed. Each fire uses the latest version published at that time.',
      cronHelp:
        "Use Spring's six fields in second, minute, hour, day, month, weekday order. Configure the timezone separately below.",
      misfireHelp:
        'Maximum delay that may be compensated after service recovery, not a retry count. Zero disables compensation.',
      overlapHelp:
        'Applies only when this trigger already has an active run. Use parallel or replacement carefully for external writes.',
      signatureHelp: 'Allowed clock difference between an external request and the server, from 30 to 3600 seconds.',
      eventTypeHelp:
        'Normalized to lowercase when saved, 3-100 characters. The publisher must use the same tenant and event type.',
      payloadSchemaHelp:
        'Validates only the external payload; it is not merged into workflow input. Webhook data is at trigger.payload, while internal-event business data is at trigger.payload.payload.',
      approvalSchemaHelp:
        'The callback must contain correlationKey and status. Status supports only PENDING, APPROVED, or REJECTED.',
      inputHelp:
        'Static workflow.input supplied to every run. It must match the workflow Input Schema; read external data separately from trigger.payload.',
      variablesHelp:
        'Static workflow.variables supplied to every run, suitable for environment, operator, or feature-switch values.',
      callbackPathHelp:
        'The returned value is a relative API path. Prefix it with the externally reachable backend origin. Public key and path may be shared; keep the signing secret private.',
      guides: {
        cron: 'Schedules start a workflow from Cron and timezone settings. New records are disabled; verify input, overlap policy, and next run before enabling.',
        webhook:
          'A webhook starts a workflow from a signed POST. Reusing an event ID with the same body returns the original run; using it with a different body is rejected.',
        event:
          'An internal event is published by an authenticated EasyAgent API and matched asynchronously through the outbox. It is not a public webhook for third-party systems.',
        approval:
          'An approval provider does not start a workflow. It uses correlationKey to resume an approval wait already active in this workflow. Copy its provider ID into the wait node.'
      },
      namePlaceholder: 'For example: Daily Complaint Processing',
      cronPresetPlaceholder: 'Select a common frequency',
      cronPlaceholder: 'For example: 0 0 9 * * *',
      timezonePlaceholder: 'Select or enter an IANA timezone',
      misfirePlaceholder: '0-86400 seconds',
      overlapPlaceholder: 'Select an overlap policy',
      signatureWindowPlaceholder: '30-3600 seconds',
      eventTypePlaceholder: 'For example: after_sales.acceptance',
      cronPresets: {
        custom: 'Custom expression',
        hourly: 'Hourly',
        daily: 'Daily at 09:00',
        everyFiveMinutes: 'Every 5 minutes',
        everySevenDays: 'Every 7 days (Monday 09:00)',
        everyThirtyDays: 'Every 30 days (day 1 at 09:00)'
      },
      overlap: {
        skip: 'Skip this run',
        queue: 'Run once after the active instance finishes',
        parallel: 'Run in parallel',
        replace: 'Replace active run'
      }
    },
    run: {
      title: 'Workflow Runs',
      description: 'Inspect execution status, node traces, and retry history',
      instanceCount: '{count} runs',
      selectWorkflow: 'Filter by workflow name or code',
      triggerType: 'Trigger',
      duration: 'Duration',
      viewDetail: 'View details',
      cancel: 'Cancel',
      retry: 'Retry',
      detail: '{name} · Run #{id}',
      graph: 'Execution graph',
      nodes: 'Nodes {count}',
      node: 'Node',
      attempts: 'Attempts {count}',
      loopBatches: 'Loop batches {count}',
      batchId: 'Batch ID',
      loopNode: 'Loop node',
      progress: 'Progress',
      progressText: '{completed} processed / {failed} failed / {total} total',
      concurrency: 'Concurrency',
      rateLimit: 'Rate/sec',
      loopItems: 'Loop items',
      loopDetail: 'Loop batch #{id} · Items',
      viewLoopItems: 'View items',
      timeline: 'Timeline {count}',
      nextRetry: 'Next retry',
      cancelConfirm: 'Cancel run #{id}?',
      cancelTitle: 'Cancel run',
      cancelled: 'Run cancelled',
      retryCreated: 'Retry run #{id} created',
      retryTitle: 'Retry failed run',
      retryOrigin: 'Source run #{id} · retry {sequence}',
      retryConfirm:
        'Create a new run from run #{id} using its pinned version and original runtime data? Replay proceeds only when the platform can prove the workflow has no external side effects.'
    },
    operations: {
      logTitle: 'Execution Logs',
      failureTitle: 'Failed Tasks',
      eventTitle: 'Event Records',
      logDescription: 'Inspect every node attempt, retry, and error summary',
      failureDescription: 'Review and close failed-run dead letters; replay requires safety validation',
      eventDescription: 'Track published, received, matched, and triggered events',
      inbox: 'Received',
      outbox: 'Published',
      eventType: 'Event type',
      deadLetterId: 'Dead letter ID',
      failureType: 'Failure type',
      handledBy: 'Handled by',
      userId: 'User #{id}',
      handledAt: 'Handled at',
      safeRetry: 'Safe retry',
      discard: 'Discard',
      eventId: 'Event ID',
      source: 'Source',
      allSources: 'All sources',
      trigger: 'Trigger',
      occurredAt: 'Occurred at',
      receivedAt: 'Received at',
      processedAt: 'Processed at',
      publishedAt: 'Published at',
      discardConfirm:
        'Discard only closes dead letter #{id}. It does not cancel, roll back, or compensate the original run or its external operations, and this page cannot reopen it. Confirm no further handling is required?',
      discardTitle: 'Discard dead letter',
      discarded: 'Dead letter closed',
      retryConfirm:
        "Request a new RETRY run using run #{id}'s pinned version and original runtime data? Replay proceeds only when the platform can prove the entire workflow has no external side effects. A successful creation marks the dead letter replayed; a rejected request leaves it open.",
      retryTitle: 'Retry dead letter',
      retryCreated: 'Retry run #{id} created'
    },
    statistics: {
      title: 'Runtime Statistics',
      description: 'Review the tenant-wide snapshot of cumulative runs, states, waits, backlog, and execution time',
      reconcile: 'Check and repair',
      reconcileConfirm:
        'Scan up to the latest 500 tenant runs with engine instance IDs and repair deterministic state differences? This may mark runs successful, partially failed, failed, or cancelled, and may terminate engine instances whose business runs are already terminal. It does not rerun workflows or roll back external operations.',
      startReconcile: 'Start check and repair',
      reconcileFailed: 'Reconciliation request failed',
      repaired: 'Repaired {count} run states',
      noRepair: 'Reconciliation complete; no repairable differences found',
      totalRuns: 'Cumulative runs',
      activeRuns: 'Currently active',
      queuedRuns: 'Created and queued',
      waitingRuns: 'Currently waiting',
      successRate: 'Completed success rate',
      failureRate: 'Completed failure rate',
      retryAttempts: 'Node retry attempts',
      openDeadLetters: 'Open dead letters',
      avgDuration: 'Average run duration',
      avgQueueDelay: 'Average queue delay',
      avgWait: 'Average current wait',
      avgNodeDuration: 'Average node duration',
      statusDistribution: 'Run status distribution',
      generatedAt: 'Statistics snapshot: {time}',
      instances: 'Runs',
      ratio: 'Share',
      lastReconcile: 'Latest manual reconciliation',
      autoReconcile: 'Runs automatically every 5 minutes by default',
      reconcileIncomplete: 'Reconciliation incomplete',
      inspected: 'Inspected',
      repairedCount: 'Repaired',
      activeTerminal: 'Business is terminal, but engine termination failed: {ids}',
      unresolved: 'No active engine instance and no confirmable historic terminal state: {ids}',
      noDifference: 'No differences require intervention',
      neverReconciled: 'No manual reconciliation yet',
      overview: 'Run overview',
      latency: 'Latency metrics'
    },
    designer: {
      nodeLibrary: 'Node library',
      variables: 'Variables',
      undo: 'Undo',
      redo: 'Redo',
      autoLayout: 'Auto layout',
      fit: 'Fit view',
      deleteSelected: 'Delete selected',
      canvasCount: '{nodes} nodes · {edges} edges',
      nodeProperties: 'Node properties',
      edgeProperties: 'Edge properties',
      workflowSettings: 'Workflow settings',
      readonly: 'Read-only',
      nodeName: 'Node name',
      nodeId: 'Node ID',
      duration: 'Wait duration',
      aggregateStrategy: 'Aggregate strategy',
      waitPolicy: 'Wait policy',
      tool: 'Tool',
      itemsPath: 'Array path',
      batchSize: 'Batch size',
      concurrency: 'Concurrency',
      rateLimit: 'Rate per second',
      failureThreshold: 'Failure threshold',
      resource: 'Resource',
      resourcePlaceholder: 'Select an enabled resource by name',
      resourceAlias: 'Resource alias',
      resourceAliasHint: 'Generated and pinned when a resource is selected',
      approvalProviderId: 'Approval provider ID',
      resourceHelp: 'Selecting a resource generates both the alias and the workflow-level binding automatically.',
      resourceAliasHelp:
        'The alias is resolved to a pinned resource ID and version at publish time. Normally, do not edit it in raw JSON.',
      systemInstruction: 'Node instruction',
      systemInstructionPlaceholder: 'Define the task, allowed evidence, output JSON, and missing-data behavior',
      model: 'Model override',
      modelPlaceholder: 'Leave blank to use the configured default model',
      maxCompletionTokens: 'Maximum output tokens',
      minConfidence: 'Minimum confidence',
      confidenceField: 'Confidence field',
      confidenceFieldPlaceholder: 'Defaults to confidence',
      llmOutputHelp:
        'LLM nodes require a non-empty Output Schema. When a confidence threshold is set, that Schema must declare a numeric field with the same name.',
      correlationPath: 'Correlation key path',
      correlationPathHelp:
        'Use a data path that uniquely identifies the approval subject, such as workflow.input.refundNo.',
      approvalProviderHelp:
        'Create an approval provider for this workflow in Trigger Management, then enter its list ID here.',
      approvalTimeout: 'Approval timeout',
      timeoutTarget: 'Timeout target',
      timeoutTargetPlaceholder: 'Select the node to run after approval timeout',
      timeoutTargetHelp: 'This is a separate timeout route; do not draw another normal edge from the wait node for it.',
      executionPolicy: 'Execution policy',
      retries: 'Retries',
      timeoutMs: 'Timeout (ms)',
      retryDelay: 'Retry delay',
      failurePolicy: 'Failure policy',
      failureTarget: 'Failure target',
      executionPolicyHelp:
        'Retry delay uses an ISO-8601 duration such as PT10S. Retry side-effecting APIs only when the external endpoint is idempotent.',
      source: 'Source',
      target: 'Target',
      condition: 'Condition expression',
      defaultBranch: 'Default branch',
      conditionHelp:
        'Supports simple comparisons, exists(path), is_null(path), or structured JSON conditions. A condition node needs exactly one default branch.',
      advancedConfig: 'Advanced data configuration',
      nodeConfig: 'Node config JSON',
      inputSchema: 'Input Schema',
      inputMapping: 'Input mappings',
      outputSchema: 'Output Schema',
      outputMapping: 'Output mappings',
      inputSchemaHelp:
        'Declares the data shape received after mapping; it does not pull values from upstream automatically.',
      inputMappingHelp:
        'Map workflow, trigger, nodes, or loop paths explicitly into node inputs. Use FAIL for missing required values.',
      outputSchemaHelp:
        'Declares the JSON Schema the primary node output must satisfy. LLM, Transform, and Aggregate nodes require a non-empty object.',
      outputMappingHelp:
        'Extract and rename stable business fields from the raw execution result. Leave empty when the raw result already has the required shape.',
      applyJson: 'Apply JSON',
      useTemplateExample: 'Use template example',
      jsonApplied: 'Configuration applied',
      jsonError: '{field} is not valid JSON',
      selectHint: 'Select a node or edge to configure',
      onlyOneStart: 'A workflow can only have one start node',
      nodeNamePlaceholder: 'Enter a recognizable node name',
      aggregateStrategyPlaceholder: 'Select an aggregation strategy',
      waitPolicyPlaceholder: 'Select a wait policy',
      toolPlaceholder: 'Select a built-in tool',
      itemsPathPlaceholder: 'For example: nodes.query.output.records',
      batchSizePlaceholder: '1-500',
      concurrencyPlaceholder: '1-32',
      rateLimitPlaceholder: '1-1000',
      failureThresholdPlaceholder: '1-10000',
      approvalProviderPlaceholder: 'Approval provider ID',
      maxRetriesPlaceholder: '0-10',
      timeoutPlaceholder: '100-3600000 ms',
      failurePolicyPlaceholder: 'Select failure handling',
      failureTargetPlaceholder: 'Select a failure branch target',
      workflowInputSchema: 'Input',
      workflowVariablesSchema: 'Variables',
      workflowOutputSchema: 'Output',
      finalOutput: 'Final output',
      resourceBindings: 'Resources',
      workflowSettingsHint:
        'Configure workflow-wide data contracts and resource aliases. Click blank canvas space to return here.',
      workflowInputHelp:
        'Defines the JSON Schema for manual-run and trigger input. The actual payload is validated when a run starts.',
      workflowVariablesHelp:
        'Defines runtime variables separate from business input. Values come from the manual-run or trigger Variables field.',
      workflowOutputHelp: 'Defines the final workflow result Schema and must agree with Final output mapping targets.',
      finalOutputHelp: 'Build the final result from workflow.input, workflow.variables, or nodes.<nodeId>.output.',
      resourceBindingsHelp:
        'Resource selection on a node maintains this array automatically. Use this editor only for expert inspection or special bindings.',
      invalidEndpoint: 'Invalid edge endpoint',
      selfEdge: 'A node cannot connect to itself',
      endOutgoing: 'End nodes cannot have outgoing edges',
      startIncoming: 'Start nodes cannot have incoming edges',
      duplicateEdge: 'This edge already exists',
      cycleEdge: 'This edge creates an unsupported cycle',
      copiedVariable: 'Copied {value}',
      categories: {
        control: 'Flow control',
        data: 'Data processing',
        ai: 'AI capabilities',
        integration: 'Integrations'
      },
      nodes: {
        start: 'Start',
        end: 'End',
        condition: 'Condition',
        parallel: 'Parallel gateway',
        delay: 'Delay',
        wait_event: 'Wait event',
        batch_loop: 'Batch loop',
        aggregate: 'Aggregate',
        transform: 'Transform',
        builtin: 'Built-in tool',
        datasource: 'Data source',
        rag: 'Knowledge retrieval',
        llm: 'LLM',
        nl2sql: 'NL2SQL',
        skill: 'Skill',
        agent: 'Agent task',
        api: 'API',
        subflow: 'Subflow'
      },
      builtins: {
        current_datetime: 'Current date and time',
        date_calculate: 'Date calculation',
        calculator: 'Calculator',
        unit_convert: 'Unit conversion'
      },
      aggregateOptions: {
        object: 'Merge objects',
        concat: 'Concatenate arrays',
        coalesce: 'First non-empty',
        branch_union: 'Union branches'
      },
      waitOptions: { all_required: 'Wait for all required inputs', any: 'Any input' },
      failureOptions: { fail: 'Fail workflow', branch: 'Use failure branch' }
    },
    help: {
      workflowTitle: 'Workflow Configuration Guide',
      triggerTitle: 'Trigger Configuration Guide',
      runtimeTitle: 'Runtime and Failure Guide',
      logTitle: 'Execution Log Troubleshooting Guide',
      failureTitle: 'Failed Task Handling Guide',
      eventTitle: 'Event Record Troubleshooting Guide',
      statisticsTitle: 'Runtime Statistics and Reconciliation Guide',
      workflowIntro:
        'Workflows orchestrate queries, generation, transformations, external APIs, and explicit approvals as background tasks. Drafts auto-save, but changes only enter runs after validation and publication.',
      triggerIntro:
        'Schedules, webhooks, and internal events start published workflows. Approval providers instead resume an existing approval wait. Select the type first and follow its own data and security contract.',
      runtimeIntro:
        'Workflow Runs shows the pinned version, node trace, attempts, loop batches, and timeline. Cancellation does not roll back completed external calls; retry creates a new run and must pass replay-safety checks.',
      logIntro:
        'Execution Logs records the status, worker thread, and error summary for every node attempt. Use it to confirm how many times a node actually ran and whether a failure entered automatic retry.',
      failureIntro:
        'Failed Tasks stores dead letters produced by terminally failed runs. Confirm the root cause and external business state before requesting safe replay or simply closing the dead letter.',
      eventIntro:
        'Event Records is a read-only diagnostic view. Published tracks internal-event dispatch only; Received tracks matching and processing after internal events, webhooks, and approval callbacks enter the Inbox.',
      statisticsIntro:
        'Runtime Statistics is a cumulative tenant snapshot cached for five minutes. Refresh reads the endpoint again but does not bypass that cache; check the snapshot timestamp before deciding whether a new run is included.',
      stepsTitle: 'Quick start',
      fieldsTitle: 'Configuration details',
      examplesTitle: 'Complete example',
      notesTitle: 'Acceptance and notes',
      workflowSteps:
        '1. Create a workflow with a business-facing name, stable code, clear boundary, and the closest starter template.\n2. Click blank canvas space to define workflow input, variables, output, and final output; drag nodes from the library and connect them by data dependency.\n3. For API, Skill, Datasource, NL2SQL, or Subflow nodes, select the resource by name. The designer creates its alias and binding automatically.\n4. In Advanced data configuration, define the Input Schema and map upstream values; define the Output Schema and optionally normalize raw results with Output mappings.\n5. Configure timeout, retry, and failure routes. Fix every validation error, publish, then run the published version for a real integration test. Unpublished drafts never run.',
      triggerSteps:
        '1. Publish the target workflow. Only published workflows appear in the selector.\n2. Choose Schedule, Webhook, Internal Event, or Approval Provider, then select the workflow and enter a purpose-oriented name.\n3. Configure the type-specific fields: Cron and overlap; signed Webhook schema; authenticated internal-event type and schema; or approval callback schema.\n4. For the first three types, configure static workflow input and variables separately from external trigger payload. Save creates a disabled record, so verify it before enabling.\n5. For Webhook or Approval, store the one-time secret and test a signed request. For Approval, copy the provider ID into the workflow wait node, republish the workflow, then enable the provider.',
      runtimeSteps:
        '1. Filter by workflow name, code, or status and confirm the pinned version, trigger, duration, and run-level error.\n2. Open Details or double-click a row, then inspect Graph, Nodes, Attempts, Loop batches, and Timeline in order.\n3. WAITING_EVENT covers ordinary event waits, approval waits, and batch-loop waits; use Timeline and Event Records to identify the expected signal.\n4. Active runs may be cancelled, but completed external writes are not rolled back.\n5. Only FAILED runs may request retry. The platform validates the pinned version, historical runtime data, and side-effect safety before creating a RETRY run.',
      logSteps:
        '1. Copy the run ID from Run Instances and search for every node attempt in that run.\n2. Add a node run ID to narrow the result to one node; use status to distinguish running, succeeded, terminal failure, and automatic retry wait.\n3. In descending start-time order, compare attempt number, error category, error code, and error summary.\n4. RETRY_WAIT means this attempt failed and the process engine is waiting to retry it; the next execution creates another attempt row.\n5. For terminal FAILED records that need manual handling, open Failed Tasks. Return to Run Instances for node and timeline context.',
      failureSteps:
        '1. Filter by run ID or OPEN status to locate pending dead letters.\n2. Use the run ID and node run ID in Run Instances and Execution Logs to confirm the final error, completed nodes, and external business result.\n3. After fixing a transient cause, request safe replay only when the workflow can be replayed without external side effects.\n4. If input or workflow configuration must change, publish a new version and explicitly start a new run instead of replaying the pinned old version.\n5. Discard the dead letter when the business action was handled manually, no longer needs execution, or cannot be replayed safely.',
      eventSteps:
        '1. Choose Received or Published for the question: use Published to confirm an internal event was dispatched, and Received to inspect matching, run startup, or approval resumption.\n2. Enter the complete event type. Received also supports Internal event, Webhook, and Approval callback source filters.\n3. Use only statuses available for the selected direction and correlate dispatch, matching, and per-trigger delivery rows by event ID.\n4. For UNMATCHED, verify an enabled internal-event trigger and its event type; the background rematcher retries periodically. For REJECTED, correct the internal-event payload against the trigger Schema.\n5. Continue in Run Instances when a run ID exists. If an external request has no Received row at all, check its URL, signature, timestamp, body, and Schema first.',
      statisticsSteps:
        '1. Check the Statistics snapshot time first. New runs, node retries, and dead letters may not enter the metrics until the cache expires.\n2. Use Cumulative runs, Currently active, Created and queued, and Currently waiting for scale and backlog, then review completed success/failure rates, node retry attempts, and open dead letters.\n3. Use the status distribution to identify the concentrated state. WAITING_EVENT, WAITING_TIMER, and RETRY_WAIT all count as currently waiting.\n4. Use Run Instances for individual runs, Execution Logs for node retries, Failed Tasks for open dead letters, and Event Records for event waits.\n5. Use Check and repair only when the business run state may disagree with Flowable, and read the mutation scope in the confirmation before proceeding.',
      workflowFields:
        'Resources: select API, Skill, Datasource, NL2SQL, and Subflow resources by name; aliases and bindings are maintained automatically. RAG searches tenant knowledge with the run identity ACL and has no knowledge-base binding.\nMappings: sourceKind is PATH or CONSTANT; missingPolicy is FAIL, OMIT, NULL, or DEFAULT; conversion is STRICT, STRING, INTEGER, LONG, DECIMAL, BOOLEAN, OBJECT, or ARRAY.\nPaths: workflow.input, workflow.variables, trigger.payload, nodes.<nodeId>.output, and loop.item/index/key. Output mappings read only from raw.\nBoundaries: Datasource returns datasource and authorized Schema catalog metadata; NL2SQL performs the query. Automation API nodes execute directly without chat HITL. Skill and Agent nodes cannot run API operations indirectly, and a background Agent fails when it needs clarification.\nLLM requires a non-empty structured Output Schema and supports max tokens and a numeric confidence threshold field. Transform allows at most 64 operations; Transform and Aggregate require non-empty input mappings and output schemas.\nApproval waits require a provider ID, unique correlation path, PT1M-P30D timeout, and timeout target.',
      triggerFields:
        'Schedule: Spring Cron uses second, minute, hour, day, month, weekday order and an IANA timezone. Misfire is a recovery-compensation window from 0-86400 seconds. SKIP skips an overlapping fire; QUEUE coalesces it into one later run; PARALLEL runs concurrently; REPLACE cancels the active run and starts the new one.\nWebhook: the JSON Schema validates the POST body. External data remains at trigger.payload; static input and variables are not merged with it.\nInternal event: type is normalized to lowercase, starts with a-z, and then contains 2-99 characters from a-z, 0-9, dot, underscore, colon, or hyphen. Publishing requires an authenticated AGENT_ADMIN or SYS_ADMIN. Business data is at trigger.payload.payload.\nApproval provider: it never starts a run. correlationKey must match an active wait created with this provider ID, while status is PENDING, APPROVED, or REJECTED.\nSigning: send X-Automation-Timestamp, X-Automation-Event-Id, and X-Automation-Signature. The signature is v1= plus HMAC-SHA256 hex over timestamp + "." + eventId + "." + the exact raw body.',
      runtimeFields:
        'Statuses: CREATED, QUEUED, RUNNING, WAITING_EVENT, WAITING_TIMER, and RETRY_WAIT are active; SUCCESS, PARTIAL_FAILURE, FAILED, and CANCELLED are terminal. Approval waits appear as WAITING_EVENT at run level; there is no separate pending-approval run status.\nDetails: Nodes show state, attempt count, error, and timing. Attempts show worker, error code, summary, and timing. Timeline preserves key state events. RETRY_WAIT means automatic retry is pending, but this page does not expose the exact Flowable job schedule.\nLoops: processed includes successful, failed, and skipped items; failed is a subset of processed. This page currently provides item inspection but does not expose terminal failed-item replay.\nRetry: only FAILED runs qualify. Replay pins the original version, input, variables, and trigger payload; missing history, an unreplayable version, or nodes whose side effects cannot be proven absent cause rejection.',
      logFields:
        'Attempt ID uniquely identifies one node call. Node run ID identifies the node execution within this workflow run and is shared by its automatic retries. Attempt number starts at 1.\nError category is VALIDATION, AUTH, RATE_LIMIT, TIMEOUT, TRANSIENT, BUSINESS, POLICY, CANCELLED, or UNKNOWN; error code and summary provide the specific cause.\nWorker is the thread identifier that handled the attempt. Completion time ends this attempt, not the whole workflow.\nSecurity boundary: raw node input and output bodies are not exposed in this list, preventing runtime payloads and sensitive data from appearing directly in the log page.',
      failureFields:
        'OPEN is pending and allows replay request or discard. REPLAYED means a new RETRY run was created; it does not mean that new run completed successfully. DISCARDED closes the dead letter and this page cannot reopen it.\nFailure type is the standard category of the final failed node; inspect Execution Logs for the specific error code and summary. Handled by identifies the tenant user who replayed or discarded it.\nSafe replay pins the original workflow version, input, variables, and trigger payload. Historical data must still exist, and every non-control node must be provably free of external side effects.',
      eventFields:
        'Published contains internal events only. PENDING waits for background dispatch. PUBLISHED only means the dispatch transaction completed; it does not guarantee that a trigger matched or a run started.\nReceived sources are INTERNAL, WEBHOOK, and APPROVAL. UNMATCHED means no internal-event trigger matched; MATCHED means a later rematch succeeded; REJECTED mainly means an internal event matched a trigger but failed its payload Schema; STARTED means a run was created; PROCESSED means an approval callback processed and referenced its existing waiting run.\nOne internal event that matches multiple triggers produces multiple Received rows with the same event ID. Occurred is the source time, Received is Inbox insertion time, and Processed/Published is the completion time for that direction.',
      statisticsFields:
        'Cumulative runs and status distribution cover all runs in the current tenant. Currently active is total minus SUCCESS, PARTIAL_FAILURE, FAILED, and CANCELLED. Created and queued is CREATED + QUEUED. Currently waiting is WAITING_EVENT + WAITING_TIMER + RETRY_WAIT.\nCompleted success/failure rates use only SUCCESS, PARTIAL_FAILURE, and FAILED as the denominator. PARTIAL_FAILURE counts as failure, CANCELLED is excluded, and the two rates total 100% when completed runs exist. Node retry attempts counts node attempts where attemptNo > 1, not workflow-level RETRY runs.\nAverage run duration uses runs with both start and completion times. Queue delay uses started runs from creation to start. Current average wait measures current waiting runs from their latest update to now. Average node duration uses completed nodes only.',
      workflowExample:
        'Create a refund request\nStart -> NL2SQL (read one refundable order) -> LLM (generate a structured reason) -> Transform (build request) -> API (create refund) -> End\nNL2SQL input: query <- workflow.input.query\nLLM Output Schema: refundReason is a string\nTransform input: order <- nodes.order_query.output.rows; reason <- nodes.reason.output.refundReason\nAPI input: map orderNo, amount, and reason from Transform output\nThe API node executes for real. For external approval, add a Wait event before it and use the documented two-publication approval bootstrap.',
      triggerExample:
        'Schedule example\nDaily 09:00: 0 0 9 * * *\nTimezone: Asia/Shanghai; misfire: 300 seconds; overlap: SKIP\n\nSigned Webhook example\nBody field: orderNo = SO20260805001\nX-Automation-Timestamp: current Unix seconds\nX-Automation-Event-Id: refund-SO20260805001-v1\nX-Automation-Signature: v1=<HMAC-SHA256 hex>\nWorkflow mapping reads orderNo from trigger.payload.orderNo.',
      runtimeExample:
        'Acceptance example: create refund requests\n- Workflow name, pinned version, and trigger match this execution\n- Nodes complete in NL2SQL, LLM, Transform, API order and Attempt counts match retry policy\n- Loop processed count never exceeds total; failed is displayed as a subset of processed\n- Start, failure/retry, wait, and completion order agrees with external business records\n- SUCCESS or PARTIAL_FAILURE has explainable evidence; FAILED remains intact and a successful safety check creates a separate RETRY run',
      logExample:
        'A node succeeds after one timeout\nAttempt 1: RETRY_WAIT / TIMEOUT / API_TIMEOUT means the first call failed and entered automatic retry\nAttempt 2: SUCCESS means the later call completed\nBoth rows have the same node run ID, increasing attempt numbers, and different attempt IDs. If the last row is FAILED, continue with its error category and Failed Tasks.',
      failureExample:
        'Handle a timeout dead letter\n1. Confirm in Execution Logs that automatic node retries are exhausted and no external business write occurred.\n2. Fix the network or dependent service, then request safe replay.\n3. If validation succeeds, the platform creates a RETRY run and marks the dead letter REPLAYED; follow the new run in Run Instances.\n4. If the workflow contains API, Skill, or other nodes whose side effects cannot be disproved, replay is rejected and the dead letter stays OPEN. Correct the cause and explicitly start a new run instead.',
      eventExample:
        'Internal-event troubleshooting\n1. Search Published for after_sales.acceptance. PUBLISHED means dispatch completed.\n2. Switch to Received, choose Internal event, and correlate rows using the same event ID.\n3. UNMATCHED means no enabled trigger of that type existed at arrival; enable or correct the trigger and wait for rematching.\n4. The MATCHED placeholder shows that rematching completed, while each matched trigger has a separate delivery row.\n5. For a STARTED row with a run ID, use Run Instances to confirm the pinned version and node results.',
      statisticsExample:
        'Backlog troubleshooting\n1. With a current snapshot, Created and queued keeps rising: filter CREATED and QUEUED in Run Instances and check the engine, concurrency, and dependencies.\n2. Currently waiting rises: separate WAITING_EVENT, WAITING_TIMER, and RETRY_WAIT. Use Event Records for event waits and Execution Logs for retry waits.\n3. Completed failure rate and node retries rise together: inspect failed runs, error categories, and external dependencies.\n4. Open dead letters is nonzero: handle each item in Failed Tasks after checking side effects. Reconciliation is not a replacement for retry or dead-letter handling.',
      workflowNote:
        'An approval provider can only target a published workflow. First publish a base version without a provider ID. In Trigger Management create a disabled Approval Provider and copy its ID; fill the wait node provider, correlation path, timeout, and timeout target; republish, then enable the provider. API nodes generate workflow idempotency keys, but the external endpoint must still enforce idempotency.',
      triggerNote:
        'New records are disabled. Webhook and approval bodies are limited to 1 MB. Reusing an event ID with the identical body is idempotent; reusing it with different content returns a conflict. Rotating a secret invalidates the old secret immediately. The monthly preset runs on day 1 and is not a strict 30-day interval.',
      runtimeNote:
        'Cancellation terminates unfinished flow work but neither compensates nor rolls back successful external API calls. Automatic retry is not forced replay: API, Skill, and other nodes whose side effects cannot be proven absent are rejected. Terminal loop-item replay does not currently have a reliable workflow-resume loop, so the page does not expose it; retain the evidence, correct the cause, and start a new workflow run.',
      logNote:
        'Execution Logs is read-only and tenant-scoped. The page shows summaries rather than full stack traces and does not provide export. To inspect business input or output, correlate Run Instances, the external system audit trail, and server logs within your authorization boundary.',
      failureNote:
        'Discarding changes only the dead-letter status; it does not cancel, roll back, or compensate the original run or completed external operations. Safe replay uses the same validation as retry from Run Instances and is not a way around those restrictions.',
      eventNote:
        'Cron creates runs directly and bypasses Inbox/Outbox. Webhook and approval callbacks validate the public key, timestamp, signature, JSON, and Schema before inserting a Received row, so these validation failures normally leave no Event Record. Use the caller response and server logs. The page shows payload hashes, not full sensitive bodies.',
      statisticsNote:
        'Check and repair scans up to the latest 500 runs with Flowable instance IDs and writes actual repairs. Engine dead letters or historic terminal state may mark a business run FAILED, CANCELLED, SUCCESS, or PARTIAL_FAILURE, and an engine instance may be terminated when its business run is already terminal. It does not rerun nodes or compensate or roll back external operations. When the automation engine is enabled, the background job runs every five minutes by default. Manual reconciliation is for state-discrepancy diagnosis, not routine refresh.'
    }
  }
};

export default local;
