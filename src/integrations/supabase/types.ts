export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          alert_type: string
          created_at: string
          expires_at: string | null
          id: string
          is_dismissed: boolean
          is_read: boolean
          message: string | null
          reference_id: string | null
          reference_type: string | null
          severity: string
          title: string
          user_id: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_dismissed?: boolean
          is_read?: boolean
          message?: string | null
          reference_id?: string | null
          reference_type?: string | null
          severity?: string
          title: string
          user_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_dismissed?: boolean
          is_read?: boolean
          message?: string | null
          reference_id?: string | null
          reference_type?: string | null
          severity?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      app_user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          owner_id: string
          team_member_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          owner_id: string
          team_member_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          owner_id?: string
          team_member_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_transactions: {
        Row: {
          account_id: string | null
          amount: number
          created_at: string
          description: string
          id: string
          is_reconciled: boolean
          reconciled_at: string | null
          reference_number: string | null
          transaction_date: string
          transaction_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          created_at?: string
          description: string
          id?: string
          is_reconciled?: boolean
          reconciled_at?: string | null
          reference_number?: string | null
          transaction_date: string
          transaction_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          created_at?: string
          description?: string
          id?: string
          is_reconciled?: boolean
          reconciled_at?: string | null
          reference_number?: string | null
          transaction_date?: string
          transaction_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      benefits: {
        Row: {
          benefit_name: string
          benefit_type: string
          cost_employee: number
          cost_employer: number
          created_at: string
          deduction_frequency: string
          description: string | null
          id: string
          is_active: boolean
          provider: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          benefit_name: string
          benefit_type: string
          cost_employee?: number
          cost_employer?: number
          created_at?: string
          deduction_frequency?: string
          description?: string | null
          id?: string
          is_active?: boolean
          provider?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          benefit_name?: string
          benefit_type?: string
          cost_employee?: number
          cost_employer?: number
          created_at?: string
          deduction_frequency?: string
          description?: string | null
          id?: string
          is_active?: boolean
          provider?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bills: {
        Row: {
          amount: number
          bill_number: string | null
          category_id: string | null
          created_at: string
          due_date: string
          id: string
          notes: string | null
          status: string
          updated_at: string
          user_id: string
          vendor_name: string
        }
        Insert: {
          amount: number
          bill_number?: string | null
          category_id?: string | null
          created_at?: string
          due_date: string
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
          user_id: string
          vendor_name: string
        }
        Update: {
          amount?: number
          bill_number?: string | null
          category_id?: string | null
          created_at?: string
          due_date?: string
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          vendor_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "bills_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          name: string
          type: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
          type: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      chart_of_accounts: {
        Row: {
          account_type: string
          action_type: string
          bank_balance: number | null
          created_at: string
          detail_type: string
          id: string
          is_active: boolean
          name: string
          quickbooks_balance: number
          updated_at: string
          user_id: string
        }
        Insert: {
          account_type: string
          action_type?: string
          bank_balance?: number | null
          created_at?: string
          detail_type: string
          id?: string
          is_active?: boolean
          name: string
          quickbooks_balance?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          account_type?: string
          action_type?: string
          bank_balance?: number | null
          created_at?: string
          detail_type?: string
          id?: string
          is_active?: boolean
          name?: string
          quickbooks_balance?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      client_bank_accounts: {
        Row: {
          account_name: string
          account_number_last4: string | null
          account_type: string | null
          balance: number | null
          client_id: string
          created_at: string
          id: string
          institution_name: string
          last_synced: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_name: string
          account_number_last4?: string | null
          account_type?: string | null
          balance?: number | null
          client_id: string
          created_at?: string
          id?: string
          institution_name: string
          last_synced?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_name?: string
          account_number_last4?: string | null
          account_type?: string | null
          balance?: number | null
          client_id?: string
          created_at?: string
          id?: string
          institution_name?: string
          last_synced?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_bank_accounts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_invitations: {
        Row: {
          client_email: string
          client_name: string
          client_user_id: string | null
          created_at: string
          expires_at: string | null
          firm_id: string
          id: string
          invite_token: string | null
          inviter_business_name: string | null
          message: string | null
          responded_at: string | null
          sent_at: string
          status: string
          updated_at: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          client_email: string
          client_name: string
          client_user_id?: string | null
          created_at?: string
          expires_at?: string | null
          firm_id: string
          id?: string
          invite_token?: string | null
          inviter_business_name?: string | null
          message?: string | null
          responded_at?: string | null
          sent_at?: string
          status?: string
          updated_at?: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          client_email?: string
          client_name?: string
          client_user_id?: string | null
          created_at?: string
          expires_at?: string | null
          firm_id?: string
          id?: string
          invite_token?: string | null
          inviter_business_name?: string | null
          message?: string | null
          responded_at?: string | null
          sent_at?: string
          status?: string
          updated_at?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      client_recommendations: {
        Row: {
          client_id: string | null
          converted_at: string | null
          created_at: string
          id: string
          recommendation_id: string | null
          sent_at: string
          status: string
          user_id: string
        }
        Insert: {
          client_id?: string | null
          converted_at?: string | null
          created_at?: string
          id?: string
          recommendation_id?: string | null
          sent_at?: string
          status?: string
          user_id: string
        }
        Update: {
          client_id?: string | null
          converted_at?: string | null
          created_at?: string
          id?: string
          recommendation_id?: string | null
          sent_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_recommendations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_recommendations_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "product_recommendations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_subscriptions: {
        Row: {
          billing_cycle: string
          client_id: string | null
          created_at: string
          id: string
          next_billing_date: string
          plan_name: string
          price: number
          start_date: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_cycle?: string
          client_id?: string | null
          created_at?: string
          id?: string
          next_billing_date: string
          plan_name: string
          price?: number
          start_date?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_cycle?: string
          client_id?: string | null
          created_at?: string
          id?: string
          next_billing_date?: string
          plan_name?: string
          price?: number
          start_date?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_subscriptions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          business_name: string | null
          client_name: string
          client_number: string | null
          contact_name: string | null
          created_at: string
          email: string | null
          id: string
          lead_accountant: string | null
          notes: string | null
          phone: string | null
          status: string
          tax_prep_status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          business_name?: string | null
          client_name: string
          client_number?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          lead_accountant?: string | null
          notes?: string | null
          phone?: string | null
          status?: string
          tax_prep_status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          business_name?: string | null
          client_name?: string
          client_number?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          lead_accountant?: string | null
          notes?: string | null
          phone?: string | null
          status?: string
          tax_prep_status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contractor_invoices: {
        Row: {
          contractor_id: string
          created_at: string
          description: string | null
          due_date: string
          flat_amount: number | null
          hourly_rate: number | null
          hours_worked: number | null
          id: string
          invoice_date: string
          invoice_number: string
          notes: string | null
          paid_at: string | null
          status: string
          subtotal: number
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          contractor_id: string
          created_at?: string
          description?: string | null
          due_date: string
          flat_amount?: number | null
          hourly_rate?: number | null
          hours_worked?: number | null
          id?: string
          invoice_date?: string
          invoice_number: string
          notes?: string | null
          paid_at?: string | null
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          contractor_id?: string
          created_at?: string
          description?: string | null
          due_date?: string
          flat_amount?: number | null
          hourly_rate?: number | null
          hours_worked?: number | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          notes?: string | null
          paid_at?: string | null
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contractor_invoices_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_invoices_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      contractor_payments: {
        Row: {
          amount: number
          contractor_id: string
          created_at: string
          description: string | null
          id: string
          is_1099_generated: boolean
          payment_date: string
          tax_year: number
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          contractor_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_1099_generated?: boolean
          payment_date: string
          tax_year: number
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          contractor_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_1099_generated?: boolean
          payment_date?: string
          tax_year?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contractor_payments_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_payments_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      contractor_rates: {
        Row: {
          contractor_id: string
          created_at: string
          description: string | null
          id: string
          is_default: boolean | null
          rate: number
          rate_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          contractor_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          rate?: number
          rate_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          contractor_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          rate?: number
          rate_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contractor_rates_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_rates_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      contractors: {
        Row: {
          address: string | null
          business_name: string | null
          city: string | null
          created_at: string
          email: string | null
          first_name: string
          id: string
          last_name: string
          payment_terms: string | null
          phone: string | null
          rate: number
          state: string | null
          status: string
          tax_id: string | null
          updated_at: string
          user_id: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          business_name?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          payment_terms?: string | null
          phone?: string | null
          rate?: number
          state?: string | null
          status?: string
          tax_id?: string | null
          updated_at?: string
          user_id: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          business_name?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          payment_terms?: string | null
          phone?: string | null
          rate?: number
          state?: string | null
          status?: string
          tax_id?: string | null
          updated_at?: string
          user_id?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      document_reminders: {
        Row: {
          client_id: string | null
          created_at: string
          description: string | null
          document_type: string
          due_date: string
          file_url: string | null
          id: string
          reminder_sent_at: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          description?: string | null
          document_type: string
          due_date: string
          file_url?: string | null
          id?: string
          reminder_sent_at?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          description?: string | null
          document_type?: string
          due_date?: string
          file_url?: string | null
          id?: string
          reminder_sent_at?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_reminders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          client_id: string | null
          created_at: string
          description: string | null
          document_type: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          description?: string | null
          document_type?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          description?: string | null
          document_type?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_benefits: {
        Row: {
          benefit_id: string
          created_at: string
          employee_id: string
          enrollment_date: string
          id: string
          updated_at: string
        }
        Insert: {
          benefit_id: string
          created_at?: string
          employee_id: string
          enrollment_date: string
          id?: string
          updated_at?: string
        }
        Update: {
          benefit_id?: string
          created_at?: string
          employee_id?: string
          enrollment_date?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_benefits_benefit_id_fkey"
            columns: ["benefit_id"]
            isOneToOne: false
            referencedRelation: "benefits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_benefits_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_pay_config: {
        Row: {
          additional_federal_withholding: number | null
          additional_state_withholding: number | null
          allowances: number | null
          bonuses: number | null
          created_at: string
          employee_id: string
          federal_filing_status: string | null
          id: string
          overtime_rate: number | null
          pay_schedule_id: string | null
          post_tax_deductions: number | null
          pre_tax_deductions: number | null
          reimbursements: number | null
          state_filing_status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          additional_federal_withholding?: number | null
          additional_state_withholding?: number | null
          allowances?: number | null
          bonuses?: number | null
          created_at?: string
          employee_id: string
          federal_filing_status?: string | null
          id?: string
          overtime_rate?: number | null
          pay_schedule_id?: string | null
          post_tax_deductions?: number | null
          pre_tax_deductions?: number | null
          reimbursements?: number | null
          state_filing_status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          additional_federal_withholding?: number | null
          additional_state_withholding?: number | null
          allowances?: number | null
          bonuses?: number | null
          created_at?: string
          employee_id?: string
          federal_filing_status?: string | null
          id?: string
          overtime_rate?: number | null
          pay_schedule_id?: string | null
          post_tax_deductions?: number | null
          pre_tax_deductions?: number | null
          reimbursements?: number | null
          state_filing_status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_pay_config_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_pay_config_pay_schedule_id_fkey"
            columns: ["pay_schedule_id"]
            isOneToOne: false
            referencedRelation: "pay_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          email: string | null
          first_name: string
          hire_date: string | null
          id: string
          last_name: string
          pay_rate: number
          pay_type: string
          phone: string | null
          state: string | null
          status: string
          target_utilization: number | null
          tax_withholding_allowances: number
          updated_at: string
          user_id: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          first_name: string
          hire_date?: string | null
          id?: string
          last_name: string
          pay_rate?: number
          pay_type?: string
          phone?: string | null
          state?: string | null
          status?: string
          target_utilization?: number | null
          tax_withholding_allowances?: number
          updated_at?: string
          user_id: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          first_name?: string
          hire_date?: string | null
          id?: string
          last_name?: string
          pay_rate?: number
          pay_type?: string
          phone?: string | null
          state?: string | null
          status?: string
          target_utilization?: number | null
          tax_withholding_allowances?: number
          updated_at?: string
          user_id?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      financial_goals: {
        Row: {
          category: string
          created_at: string
          current_amount: number
          description: string | null
          due_date: string
          id: string
          name: string
          start_date: string
          status: string
          target_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          current_amount?: number
          description?: string | null
          due_date: string
          id?: string
          name: string
          start_date: string
          status?: string
          target_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          current_amount?: number
          description?: string | null
          due_date?: string
          id?: string
          name?: string
          start_date?: string
          status?: string
          target_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      generated_1099s: {
        Row: {
          contractor_id: string
          created_at: string
          federal_tax_withheld: number | null
          generated_at: string
          id: string
          payer_address: string | null
          payer_city: string | null
          payer_name: string | null
          payer_state: string | null
          payer_tin: string | null
          payer_zip: string | null
          pdf_url: string | null
          sent_at: string | null
          state_income: number | null
          state_payer_number: string | null
          state_tax_withheld: number | null
          status: string | null
          tax_year: number
          total_compensation: number
          updated_at: string
          user_id: string
        }
        Insert: {
          contractor_id: string
          created_at?: string
          federal_tax_withheld?: number | null
          generated_at?: string
          id?: string
          payer_address?: string | null
          payer_city?: string | null
          payer_name?: string | null
          payer_state?: string | null
          payer_tin?: string | null
          payer_zip?: string | null
          pdf_url?: string | null
          sent_at?: string | null
          state_income?: number | null
          state_payer_number?: string | null
          state_tax_withheld?: number | null
          status?: string | null
          tax_year: number
          total_compensation?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          contractor_id?: string
          created_at?: string
          federal_tax_withheld?: number | null
          generated_at?: string
          id?: string
          payer_address?: string | null
          payer_city?: string | null
          payer_name?: string | null
          payer_state?: string | null
          payer_tin?: string | null
          payer_zip?: string | null
          pdf_url?: string | null
          sent_at?: string | null
          state_income?: number | null
          state_payer_number?: string | null
          state_tax_withheld?: number | null
          status?: string | null
          tax_year?: number
          total_compensation?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_1099s_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_1099s_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_line_items: {
        Row: {
          created_at: string | null
          description: string
          id: string
          invoice_id: string
          quantity: number
          rate: number
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          invoice_id: string
          quantity?: number
          rate?: number
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string
          notes: string | null
          payment_date: string
          payment_method: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          invoice_id: string
          notes?: string | null
          payment_date?: string
          payment_method?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_templates: {
        Row: {
          business_address: string | null
          business_email: string | null
          business_name: string | null
          business_phone: string | null
          created_at: string | null
          font_family: string | null
          id: string
          is_default: boolean | null
          logo_url: string | null
          name: string
          primary_color: string | null
          secondary_color: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          business_address?: string | null
          business_email?: string | null
          business_name?: string | null
          business_phone?: string | null
          created_at?: string | null
          font_family?: string | null
          id?: string
          is_default?: boolean | null
          logo_url?: string | null
          name: string
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          business_address?: string | null
          business_email?: string | null
          business_name?: string | null
          business_phone?: string | null
          created_at?: string | null
          font_family?: string | null
          id?: string
          is_default?: boolean | null
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          amount_paid: number | null
          client_email: string | null
          client_name: string
          client_user_id: string | null
          created_at: string | null
          due_date: string
          id: string
          invoice_number: string
          issue_date: string
          notes: string | null
          reference: string | null
          status: string
          subtotal: number | null
          tax: number | null
          tax_name: string | null
          tax_rate: number | null
          tax_rate_id: string | null
          template_id: string | null
          terms: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          amount_paid?: number | null
          client_email?: string | null
          client_name: string
          client_user_id?: string | null
          created_at?: string | null
          due_date: string
          id?: string
          invoice_number: string
          issue_date?: string
          notes?: string | null
          reference?: string | null
          status?: string
          subtotal?: number | null
          tax?: number | null
          tax_name?: string | null
          tax_rate?: number | null
          tax_rate_id?: string | null
          template_id?: string | null
          terms?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          amount_paid?: number | null
          client_email?: string | null
          client_name?: string
          client_user_id?: string | null
          created_at?: string | null
          due_date?: string
          id?: string
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          reference?: string | null
          status?: string
          subtotal?: number | null
          tax?: number | null
          tax_name?: string | null
          tax_rate?: number | null
          tax_rate_id?: string | null
          template_id?: string | null
          terms?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_tax_rate_id_fkey"
            columns: ["tax_rate_id"]
            isOneToOne: false
            referencedRelation: "tax_rates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "invoice_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          created_at: string
          description: string | null
          entry_date: string
          entry_number: string
          id: string
          reference: string | null
          source_id: string | null
          source_type: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          entry_date?: string
          entry_number: string
          id?: string
          reference?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          entry_date?: string
          entry_number?: string
          id?: string
          reference?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      journal_entry_lines: {
        Row: {
          account_id: string
          created_at: string
          credit: number
          debit: number
          description: string | null
          id: string
          journal_entry_id: string
        }
        Insert: {
          account_id: string
          created_at?: string
          credit?: number
          debit?: number
          description?: string | null
          id?: string
          journal_entry_id: string
        }
        Update: {
          account_id?: string
          created_at?: string
          credit?: number
          debit?: number
          description?: string | null
          id?: string
          journal_entry_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entry_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entry_lines_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      module_access: {
        Row: {
          can_delete: boolean
          can_edit: boolean
          can_view: boolean
          created_at: string
          id: string
          module_name: string
          team_member_id: string
          updated_at: string
        }
        Insert: {
          can_delete?: boolean
          can_edit?: boolean
          can_view?: boolean
          created_at?: string
          id?: string
          module_name: string
          team_member_id: string
          updated_at?: string
        }
        Update: {
          can_delete?: boolean
          can_edit?: boolean
          can_view?: boolean
          created_at?: string
          id?: string
          module_name?: string
          team_member_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_access_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          is_sent: boolean
          message: string | null
          notification_type: string
          recipient_id: string | null
          reference_id: string | null
          reference_type: string | null
          sent_at: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          is_sent?: boolean
          message?: string | null
          notification_type: string
          recipient_id?: string | null
          reference_id?: string | null
          reference_type?: string | null
          sent_at?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          is_sent?: boolean
          message?: string | null
          notification_type?: string
          recipient_id?: string | null
          reference_id?: string | null
          reference_type?: string | null
          sent_at?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pay_schedules: {
        Row: {
          created_at: string
          frequency: string
          id: string
          is_default: boolean | null
          name: string
          pay_day: number | null
          second_pay_day: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          frequency?: string
          id?: string
          is_default?: boolean | null
          name: string
          pay_day?: number | null
          second_pay_day?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          frequency?: string
          id?: string
          is_default?: boolean | null
          name?: string
          pay_day?: number | null
          second_pay_day?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payouts: {
        Row: {
          amount: number
          created_at: string
          id: string
          processed_at: string | null
          requested_at: string
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          processed_at?: string | null
          requested_at?: string
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          processed_at?: string | null
          requested_at?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      payroll: {
        Row: {
          client_id: string
          created_at: string
          employee_name: string
          federal_tax: number
          gross_pay: number
          id: string
          medicare: number
          net_pay: number
          notes: string | null
          other_deductions: number
          pay_date: string
          pay_period_end: string
          pay_period_start: string
          social_security: number
          state_tax: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          employee_name: string
          federal_tax?: number
          gross_pay?: number
          id?: string
          medicare?: number
          net_pay?: number
          notes?: string | null
          other_deductions?: number
          pay_date: string
          pay_period_end: string
          pay_period_start: string
          social_security?: number
          state_tax?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          employee_name?: string
          federal_tax?: number
          gross_pay?: number
          id?: string
          medicare?: number
          net_pay?: number
          notes?: string | null
          other_deductions?: number
          pay_date?: string
          pay_period_end?: string
          pay_period_start?: string
          social_security?: number
          state_tax?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payroll_run_items: {
        Row: {
          benefit_deductions: number
          created_at: string
          employee_id: string
          federal_tax: number
          gross_pay: number
          hours_worked: number
          id: string
          medicare: number
          net_pay: number
          other_deductions: number
          overtime_hours: number
          payroll_run_id: string
          regular_hours: number
          social_security: number
          state_tax: number
          total_deductions: number
          updated_at: string
        }
        Insert: {
          benefit_deductions?: number
          created_at?: string
          employee_id: string
          federal_tax?: number
          gross_pay?: number
          hours_worked?: number
          id?: string
          medicare?: number
          net_pay?: number
          other_deductions?: number
          overtime_hours?: number
          payroll_run_id: string
          regular_hours?: number
          social_security?: number
          state_tax?: number
          total_deductions?: number
          updated_at?: string
        }
        Update: {
          benefit_deductions?: number
          created_at?: string
          employee_id?: string
          federal_tax?: number
          gross_pay?: number
          hours_worked?: number
          id?: string
          medicare?: number
          net_pay?: number
          other_deductions?: number
          overtime_hours?: number
          payroll_run_id?: string
          regular_hours?: number
          social_security?: number
          state_tax?: number
          total_deductions?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_run_items_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_run_items_payroll_run_id_fkey"
            columns: ["payroll_run_id"]
            isOneToOne: false
            referencedRelation: "payroll_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_runs: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          notes: string | null
          pay_date: string
          pay_period_end: string
          pay_period_start: string
          processed_at: string | null
          run_name: string
          status: string
          total_deductions: number
          total_gross_pay: number
          total_net_pay: number
          total_taxes: number
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          pay_date: string
          pay_period_end: string
          pay_period_start: string
          processed_at?: string | null
          run_name: string
          status?: string
          total_deductions?: number
          total_gross_pay?: number
          total_net_pay?: number
          total_taxes?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          pay_date?: string
          pay_period_end?: string
          pay_period_start?: string
          processed_at?: string | null
          run_name?: string
          status?: string
          total_deductions?: number
          total_gross_pay?: number
          total_net_pay?: number
          total_taxes?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      product_recommendations: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          price: number
          product_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          price?: number
          product_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          price?: number
          product_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          business_address: string | null
          business_city: string | null
          business_name: string | null
          business_phone: string | null
          business_state: string | null
          business_zip: string | null
          created_at: string | null
          ein: string | null
          email: string | null
          full_name: string | null
          id: string
          trial_ends_at: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          business_address?: string | null
          business_city?: string | null
          business_name?: string | null
          business_phone?: string | null
          business_state?: string | null
          business_zip?: string | null
          created_at?: string | null
          ein?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          business_address?: string | null
          business_city?: string | null
          business_name?: string | null
          business_phone?: string | null
          business_state?: string | null
          business_zip?: string | null
          created_at?: string | null
          ein?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      project_milestones: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          name: string
          project_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          name: string
          project_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          name?: string
          project_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_team_members: {
        Row: {
          assigned_at: string
          employee_id: string
          id: string
          project_id: string
          role: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string
          employee_id: string
          id?: string
          project_id: string
          role?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string
          employee_id?: string
          id?: string
          project_id?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_team_members_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_team_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          billing_rate: number | null
          budget: number
          client_name: string
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          name: string
          spent: number
          start_date: string | null
          status: string
          team_size: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_rate?: number | null
          budget?: number
          client_name: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          name: string
          spent?: number
          start_date?: string | null
          status?: string
          team_size?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_rate?: number | null
          budget?: number
          client_name?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          name?: string
          spent?: number
          start_date?: string | null
          status?: string
          team_size?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pto_balances: {
        Row: {
          accrual_rate: number
          accrued_hours: number
          balance_hours: number
          created_at: string
          employee_id: string
          id: string
          max_balance: number | null
          pto_type: string
          updated_at: string
          used_hours: number
        }
        Insert: {
          accrual_rate?: number
          accrued_hours?: number
          balance_hours?: number
          created_at?: string
          employee_id: string
          id?: string
          max_balance?: number | null
          pto_type: string
          updated_at?: string
          used_hours?: number
        }
        Update: {
          accrual_rate?: number
          accrued_hours?: number
          balance_hours?: number
          created_at?: string
          employee_id?: string
          id?: string
          max_balance?: number | null
          pto_type?: string
          updated_at?: string
          used_hours?: number
        }
        Relationships: [
          {
            foreignKeyName: "pto_balances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      pto_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          employee_id: string
          end_date: string
          hours_requested: number
          id: string
          notes: string | null
          pto_type: string
          reason: string | null
          rejection_reason: string | null
          start_date: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          employee_id: string
          end_date: string
          hours_requested: number
          id?: string
          notes?: string | null
          pto_type: string
          reason?: string | null
          rejection_reason?: string | null
          start_date: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          employee_id?: string
          end_date?: string
          hours_requested?: number
          id?: string
          notes?: string | null
          pto_type?: string
          reason?: string | null
          rejection_reason?: string | null
          start_date?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pto_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      receipts: {
        Row: {
          ai_confidence: number | null
          ai_processed_at: string | null
          amount: number | null
          category: string | null
          created_at: string
          description: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          merchant_name: string | null
          payment_method: string | null
          raw_ai_response: Json | null
          receipt_date: string | null
          status: string
          tax_amount: number | null
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_confidence?: number | null
          ai_processed_at?: string | null
          amount?: number | null
          category?: string | null
          created_at?: string
          description?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          merchant_name?: string | null
          payment_method?: string | null
          raw_ai_response?: Json | null
          receipt_date?: string | null
          status?: string
          tax_amount?: number | null
          transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_confidence?: number | null
          ai_processed_at?: string | null
          amount?: number | null
          category?: string | null
          created_at?: string
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          merchant_name?: string | null
          payment_method?: string | null
          raw_ai_response?: Json | null
          receipt_date?: string | null
          status?: string
          tax_amount?: number | null
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipts_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      reconciliation_matches: {
        Row: {
          bank_transaction_id: string | null
          created_at: string
          id: string
          ledger_transaction_id: string | null
          matched_at: string
          user_id: string
        }
        Insert: {
          bank_transaction_id?: string | null
          created_at?: string
          id?: string
          ledger_transaction_id?: string | null
          matched_at?: string
          user_id: string
        }
        Update: {
          bank_transaction_id?: string | null
          created_at?: string
          id?: string
          ledger_transaction_id?: string | null
          matched_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reconciliation_matches_bank_transaction_id_fkey"
            columns: ["bank_transaction_id"]
            isOneToOne: false
            referencedRelation: "bank_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliation_matches_ledger_transaction_id_fkey"
            columns: ["ledger_transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_invoice_line_items: {
        Row: {
          created_at: string | null
          description: string
          id: string
          quantity: number
          rate: number
          recurring_invoice_id: string
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          quantity?: number
          rate?: number
          recurring_invoice_id: string
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          quantity?: number
          rate?: number
          recurring_invoice_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_invoice_line_items_recurring_invoice_id_fkey"
            columns: ["recurring_invoice_id"]
            isOneToOne: false
            referencedRelation: "recurring_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_invoices: {
        Row: {
          amount: number
          auto_send: boolean | null
          client_email: string | null
          client_name: string
          created_at: string
          end_date: string | null
          frequency: string
          id: string
          invoice_number_prefix: string
          next_run_date: string
          notes: string | null
          start_date: string
          status: string
          subtotal: number | null
          tax: number | null
          template_id: string | null
          terms: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          auto_send?: boolean | null
          client_email?: string | null
          client_name: string
          created_at?: string
          end_date?: string | null
          frequency: string
          id?: string
          invoice_number_prefix?: string
          next_run_date: string
          notes?: string | null
          start_date?: string
          status?: string
          subtotal?: number | null
          tax?: number | null
          template_id?: string | null
          terms?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          auto_send?: boolean | null
          client_email?: string | null
          client_name?: string
          created_at?: string
          end_date?: string | null
          frequency?: string
          id?: string
          invoice_number_prefix?: string
          next_run_date?: string
          notes?: string | null
          start_date?: string
          status?: string
          subtotal?: number | null
          tax?: number | null
          template_id?: string | null
          terms?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_invoices_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "invoice_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_transactions: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          description: string | null
          end_date: string | null
          frequency: string
          id: string
          is_active: boolean
          name: string
          next_occurrence: string
          start_date: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          frequency: string
          id?: string
          is_active?: boolean
          name: string
          next_occurrence: string
          start_date: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          frequency?: string
          id?: string
          is_active?: boolean
          name?: string
          next_occurrence?: string
          start_date?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          commission_rate: number
          created_at: string
          earnings: number
          id: string
          referred_at: string
          referred_client_name: string
          referred_email: string | null
          status: string
          subscription_value: number
          updated_at: string
          user_id: string
        }
        Insert: {
          commission_rate?: number
          created_at?: string
          earnings?: number
          id?: string
          referred_at?: string
          referred_client_name: string
          referred_email?: string | null
          status?: string
          subscription_value?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          commission_rate?: number
          created_at?: string
          earnings?: number
          id?: string
          referred_at?: string
          referred_client_name?: string
          referred_email?: string | null
          status?: string
          subscription_value?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      schedule_c_reports: {
        Row: {
          client_id: string | null
          client_name: string
          confirmed_at: string | null
          created_at: string
          flagged_items: Json
          id: string
          is_confirmed: boolean
          recurring_subscriptions: Json
          summary: Json
          tax_year: number
          transactions: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id?: string | null
          client_name: string
          confirmed_at?: string | null
          created_at?: string
          flagged_items?: Json
          id?: string
          is_confirmed?: boolean
          recurring_subscriptions?: Json
          summary?: Json
          tax_year?: number
          transactions?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string | null
          client_name?: string
          confirmed_at?: string | null
          created_at?: string
          flagged_items?: Json
          id?: string
          is_confirmed?: boolean
          recurring_subscriptions?: Json
          summary?: Json
          tax_year?: number
          transactions?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_c_reports_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string
          email: string
          id: string
          message: string
          name: string
          priority: string
          resolved_at: string | null
          status: string
          subject: string
          ticket_number: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          category: string
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject: string
          ticket_number: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject?: string
          ticket_number?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      task_assignees: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          employee_id: string | null
          id: string
          role: string | null
          task_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          employee_id?: string | null
          id?: string
          role?: string | null
          task_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          employee_id?: string | null
          id?: string
          role?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_assignees_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignees_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_status_history: {
        Row: {
          changed_at: string
          id: string
          new_status: string
          notes: string | null
          old_status: string | null
          task_id: string
          user_id: string
        }
        Insert: {
          changed_at?: string
          id?: string
          new_status: string
          notes?: string | null
          old_status?: string | null
          task_id: string
          user_id: string
        }
        Update: {
          changed_at?: string
          id?: string
          new_status?: string
          notes?: string | null
          old_status?: string | null
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_status_history_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_templates: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          priority: string
          recurrence_day: number | null
          recurrence_type: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          priority?: string
          recurrence_day?: number | null
          recurrence_type?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          priority?: string
          recurrence_day?: number | null
          recurrence_type?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string | null
          category: string | null
          client_id: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          description: string | null
          due_date: string
          id: string
          priority: string
          recurrence_type: string | null
          status: string
          template_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          client_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          description?: string | null
          due_date: string
          id?: string
          priority?: string
          recurrence_type?: string | null
          status?: string
          template_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          client_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          description?: string | null
          due_date?: string
          id?: string
          priority?: string
          recurrence_type?: string | null
          status?: string
          template_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_rates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          rate: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          rate?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          rate?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tax_return_reviews: {
        Row: {
          action: string
          created_at: string
          id: string
          notes: string | null
          tax_return_id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          notes?: string | null
          tax_return_id: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          notes?: string | null
          tax_return_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_return_reviews_tax_return_id_fkey"
            columns: ["tax_return_id"]
            isOneToOne: false
            referencedRelation: "tax_returns"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_returns: {
        Row: {
          adjusted_gross_income: number | null
          amount_owed: number | null
          business_income: number | null
          charitable_contributions: number | null
          child_tax_credit: number | null
          client_id: string
          client_notes: string | null
          created_at: string
          deadline: string
          education_credits: number | null
          estimated_payments: number | null
          federal_withholding: number | null
          filing_type: string
          id: string
          investment_income: number | null
          itemized_deductions: number | null
          medical_expenses: number | null
          mortgage_interest: number | null
          notes: string | null
          other_credits: number | null
          other_income: number | null
          refund_amount: number | null
          review_notes: string | null
          review_status: string | null
          reviewed_at: string | null
          sent_for_review_at: string | null
          standard_deduction: number | null
          state_local_taxes: number | null
          status: string
          tax_year: number
          taxable_income: number | null
          total_credits: number | null
          total_deductions: number | null
          total_income: number | null
          total_tax: number | null
          updated_at: string
          user_id: string
          wages: number | null
        }
        Insert: {
          adjusted_gross_income?: number | null
          amount_owed?: number | null
          business_income?: number | null
          charitable_contributions?: number | null
          child_tax_credit?: number | null
          client_id: string
          client_notes?: string | null
          created_at?: string
          deadline: string
          education_credits?: number | null
          estimated_payments?: number | null
          federal_withholding?: number | null
          filing_type: string
          id?: string
          investment_income?: number | null
          itemized_deductions?: number | null
          medical_expenses?: number | null
          mortgage_interest?: number | null
          notes?: string | null
          other_credits?: number | null
          other_income?: number | null
          refund_amount?: number | null
          review_notes?: string | null
          review_status?: string | null
          reviewed_at?: string | null
          sent_for_review_at?: string | null
          standard_deduction?: number | null
          state_local_taxes?: number | null
          status?: string
          tax_year: number
          taxable_income?: number | null
          total_credits?: number | null
          total_deductions?: number | null
          total_income?: number | null
          total_tax?: number | null
          updated_at?: string
          user_id: string
          wages?: number | null
        }
        Update: {
          adjusted_gross_income?: number | null
          amount_owed?: number | null
          business_income?: number | null
          charitable_contributions?: number | null
          child_tax_credit?: number | null
          client_id?: string
          client_notes?: string | null
          created_at?: string
          deadline?: string
          education_credits?: number | null
          estimated_payments?: number | null
          federal_withholding?: number | null
          filing_type?: string
          id?: string
          investment_income?: number | null
          itemized_deductions?: number | null
          medical_expenses?: number | null
          mortgage_interest?: number | null
          notes?: string | null
          other_credits?: number | null
          other_income?: number | null
          refund_amount?: number | null
          review_notes?: string | null
          review_status?: string | null
          reviewed_at?: string | null
          sent_for_review_at?: string | null
          standard_deduction?: number | null
          state_local_taxes?: number | null
          status?: string
          tax_year?: number
          taxable_income?: number | null
          total_credits?: number | null
          total_deductions?: number | null
          total_income?: number | null
          total_tax?: number | null
          updated_at?: string
          user_id?: string
          wages?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tax_returns_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          can_edit: boolean
          created_at: string
          email: string
          first_name: string
          id: string
          invite_accepted_at: string | null
          invite_sent_at: string | null
          invite_token: string | null
          is_active: boolean
          last_login_at: string | null
          last_name: string
          owner_id: string
          role: Database["public"]["Enums"]["permission_level"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          can_edit?: boolean
          created_at?: string
          email: string
          first_name: string
          id?: string
          invite_accepted_at?: string | null
          invite_sent_at?: string | null
          invite_token?: string | null
          is_active?: boolean
          last_login_at?: string | null
          last_name: string
          owner_id: string
          role?: Database["public"]["Enums"]["permission_level"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          can_edit?: boolean
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          invite_accepted_at?: string | null
          invite_sent_at?: string | null
          invite_token?: string | null
          is_active?: boolean
          last_login_at?: string | null
          last_name?: string
          owner_id?: string
          role?: Database["public"]["Enums"]["permission_level"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      time_entries: {
        Row: {
          approval_status: string
          approved_at: string | null
          approved_by: string | null
          break_minutes: number
          clock_in: string
          clock_out: string | null
          created_at: string
          employee_id: string
          entry_date: string
          id: string
          is_billable: boolean
          is_overtime: boolean
          notes: string | null
          project_id: string | null
          rejection_reason: string | null
          timesheet_id: string
          total_hours: number
          updated_at: string
        }
        Insert: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          break_minutes?: number
          clock_in: string
          clock_out?: string | null
          created_at?: string
          employee_id: string
          entry_date: string
          id?: string
          is_billable?: boolean
          is_overtime?: boolean
          notes?: string | null
          project_id?: string | null
          rejection_reason?: string | null
          timesheet_id: string
          total_hours?: number
          updated_at?: string
        }
        Update: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          break_minutes?: number
          clock_in?: string
          clock_out?: string | null
          created_at?: string
          employee_id?: string
          entry_date?: string
          id?: string
          is_billable?: boolean
          is_overtime?: boolean
          notes?: string | null
          project_id?: string | null
          rejection_reason?: string | null
          timesheet_id?: string
          total_hours?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_timesheet_id_fkey"
            columns: ["timesheet_id"]
            isOneToOne: false
            referencedRelation: "timesheets"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entry_approvals: {
        Row: {
          action: string
          approved_by: string
          created_at: string
          id: string
          notes: string | null
          time_entry_id: string
          user_id: string
        }
        Insert: {
          action: string
          approved_by: string
          created_at?: string
          id?: string
          notes?: string | null
          time_entry_id: string
          user_id: string
        }
        Update: {
          action?: string
          approved_by?: string
          created_at?: string
          id?: string
          notes?: string | null
          time_entry_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entry_approvals_time_entry_id_fkey"
            columns: ["time_entry_id"]
            isOneToOne: false
            referencedRelation: "time_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      timesheets: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          employee_id: string
          id: string
          notes: string | null
          overtime_hours: number
          period_end: string
          period_start: string
          project_id: string | null
          regular_hours: number
          rejection_reason: string | null
          status: string
          submitted_at: string | null
          total_hours: number
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          employee_id: string
          id?: string
          notes?: string | null
          overtime_hours?: number
          period_end: string
          period_start: string
          project_id?: string | null
          regular_hours?: number
          rejection_reason?: string | null
          status?: string
          submitted_at?: string | null
          total_hours?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          employee_id?: string
          id?: string
          notes?: string | null
          overtime_hours?: number
          period_end?: string
          period_start?: string
          project_id?: string | null
          regular_hours?: number
          rejection_reason?: string | null
          status?: string
          submitted_at?: string | null
          total_hours?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "timesheets_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_rules: {
        Row: {
          applied_to: string | null
          auto_add: boolean
          conditions: Json
          created_at: string
          id: string
          priority: number
          rule_name: string
          settings: Json
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          applied_to?: string | null
          auto_add?: boolean
          conditions?: Json
          created_at?: string
          id?: string
          priority?: number
          rule_name: string
          settings?: Json
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          applied_to?: string | null
          auto_add?: boolean
          conditions?: Json
          created_at?: string
          id?: string
          priority?: number
          rule_name?: string
          settings?: Json
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          account_id: string | null
          amount: number
          category_id: string | null
          created_at: string | null
          date: string
          description: string
          id: string
          is_reconciled: boolean
          reconciled_at: string | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          category_id?: string | null
          created_at?: string | null
          date?: string
          description: string
          id?: string
          is_reconciled?: boolean
          reconciled_at?: string | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          category_id?: string | null
          created_at?: string | null
          date?: string
          description?: string
          id?: string
          is_reconciled?: boolean
          reconciled_at?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_custom: boolean | null
          permissions: Json | null
          role_name: string
          role_type: Database["public"]["Enums"]["role_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_custom?: boolean | null
          permissions?: Json | null
          role_name: string
          role_type?: Database["public"]["Enums"]["role_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_custom?: boolean | null
          permissions?: Json | null
          role_name?: string
          role_type?: Database["public"]["Enums"]["role_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      workflow_execution_history: {
        Row: {
          action_result: Json | null
          created_at: string
          error_message: string | null
          executed_at: string
          id: string
          status: string
          trigger_data: Json | null
          user_id: string
          workflow_id: string
        }
        Insert: {
          action_result?: Json | null
          created_at?: string
          error_message?: string | null
          executed_at?: string
          id?: string
          status: string
          trigger_data?: Json | null
          user_id: string
          workflow_id: string
        }
        Update: {
          action_result?: Json | null
          created_at?: string
          error_message?: string | null
          executed_at?: string
          id?: string
          status?: string
          trigger_data?: Json | null
          user_id?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_execution_history_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflows: {
        Row: {
          action_config: Json
          action_type: string
          created_at: string
          description: string | null
          failure_count: number
          id: string
          last_run_at: string | null
          name: string
          runs_today: number
          status: string
          success_count: number
          total_runs: number
          trigger_config: Json
          trigger_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_config?: Json
          action_type: string
          created_at?: string
          description?: string | null
          failure_count?: number
          id?: string
          last_run_at?: string | null
          name: string
          runs_today?: number
          status?: string
          success_count?: number
          total_runs?: number
          trigger_config?: Json
          trigger_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_config?: Json
          action_type?: string
          created_at?: string
          description?: string | null
          failure_count?: number
          id?: string
          last_run_at?: string | null
          name?: string
          runs_today?: number
          status?: string
          success_count?: number
          total_runs?: number
          trigger_config?: Json
          trigger_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      contractors_safe: {
        Row: {
          address: string | null
          business_name: string | null
          city: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          payment_terms: string | null
          phone: string | null
          rate: number | null
          state: string | null
          status: string | null
          tax_id_masked: string | null
          updated_at: string | null
          user_id: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          business_name?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string | null
          last_name?: string | null
          payment_terms?: string | null
          phone?: string | null
          rate?: number | null
          state?: string | null
          status?: string | null
          tax_id_masked?: never
          updated_at?: string | null
          user_id?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          business_name?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string | null
          last_name?: string | null
          payment_terms?: string | null
          phone?: string | null
          rate?: number | null
          state?: string | null
          status?: string | null
          tax_id_masked?: never
          updated_at?: string | null
          user_id?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      profiles_public: {
        Row: {
          avatar_url: string | null
          business_name: string | null
          created_at: string | null
          full_name: string | null
          id: string | null
          trial_ends_at: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          business_name?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          business_name?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      accrue_pto_for_payroll: {
        Args: { p_employee_id: string; p_user_id: string }
        Returns: undefined
      }
      can_view_profile: { Args: { _profile_id: string }; Returns: boolean }
      get_safe_profile: {
        Args: { _user_id: string }
        Returns: {
          avatar_url: string
          business_name: string
          created_at: string
          email: string
          full_name: string
          id: string
        }[]
      }
      get_team_member_permissions: {
        Args: { _user_id: string }
        Returns: {
          can_edit: boolean
          modules: Json
          role: Database["public"]["Enums"]["permission_level"]
        }[]
      }
      has_app_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      mark_invitation_used: {
        Args: { p_client_user_id: string; p_token: string }
        Returns: boolean
      }
      validate_client_invitation: {
        Args: { p_token: string }
        Returns: {
          client_email: string
          client_name: string
          error_message: string
          firm_id: string
          invitation_id: string
          inviter_business_name: string
          is_valid: boolean
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user" | "client"
      permission_level: "admin" | "accountant" | "employee"
      role_type: "client" | "firm"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "client"],
      permission_level: ["admin", "accountant", "employee"],
      role_type: ["client", "firm"],
    },
  },
} as const
